#!/usr/bin/env bash

set -euo pipefail

# This script provisions/updates backend IAM roles used by the Asharvi stack and
# optionally rotates CI/CD access keys. It relies on AWS CLI v2 and jq.

usage() {
  cat <<'USAGE'
Usage: setup_backend_infra.sh [options]

Options:
  -r, --region <aws-region>            AWS region (default: ap-south-1)
  --github-org <org>                   GitHub organisation for CI/CD role trust (required for GitHub OIDC)
  --github-repo <repo>                 GitHub repository for CI/CD role trust (required for GitHub OIDC)
  --cicd-iam-user <username>           IAM user whose access keys should be rotated (optional)
  --rotate                             Rotate access keys for the specified CI/CD IAM user
  --dynamodb-table-arn <arn>           Optional DynamoDB table ARN to include in task role policy
  --secrets-prefix <arn-prefix>        Secrets Manager ARN prefix (default: arn:aws:secretsmanager:*:*:secret:asharvi/backend/*)
  --log-group-arn <arn>                CloudWatch Logs log-group ARN pattern (default: arn:aws:logs:*:*:log-group:/aws/ecs/asharvi-backend*)
  -h, --help                           Show this help message

Examples:
  ./scripts/setup_backend_infra.sh --github-org Asharvi --github-repo backend-api \
    --cicd-iam-user asharvi-deployer --rotate

Notes:
  * AWS credentials with iam:* permissions are required.
  * When --rotate is used, the script outputs new access keys to STDOUT; store
    them securely and remove from terminal history.
USAGE
}

log() {
  echo "[$(date +"%Y-%m-%dT%H:%M:%S%z")] $*"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' not found" >&2
    exit 1
  fi
}

ensure_role() {
  local role_name="$1"
  local assume_policy="$2"
  local policy_name="$3"
  local policy_document="$4"

  if aws iam get-role --role-name "$role_name" >/dev/null 2>&1; then
    log "Role $role_name exists; updating trust policy and inline policy"
    aws iam update-assume-role-policy --role-name "$role_name" --policy-document "$assume_policy" >/dev/null
  else
    log "Creating role $role_name"
    aws iam create-role --role-name "$role_name" \
      --assume-role-policy-document "$assume_policy" \
      --description "Backend infrastructure role created by setup_backend_infra.sh" >/dev/null
  fi

  # Put inline policy (idempotent; overwrites existing policy with same name)
  aws iam put-role-policy --role-name "$role_name" --policy-name "$policy_name" --policy-document "$policy_document" >/dev/null
}

rotate_access_keys() {
  local user="$1"

  log "Rotating access keys for IAM user $user"
  local keys_json
  keys_json=$(aws iam list-access-keys --user-name "$user")
  local active_keys
  active_keys=$(echo "$keys_json" | jq -r '.AccessKeyMetadata[].AccessKeyId')

  local new_key_json
  new_key_json=$(aws iam create-access-key --user-name "$user")
  local new_key_id new_secret
  new_key_id=$(echo "$new_key_json" | jq -r '.AccessKey.AccessKeyId')
  new_secret=$(echo "$new_key_json" | jq -r '.AccessKey.SecretAccessKey')

  for key_id in $active_keys; do
    if [[ "$key_id" != "$new_key_id" ]]; then
      log "Deactivating old key $key_id"
      aws iam update-access-key --user-name "$user" --access-key-id "$key_id" --status Inactive >/dev/null
      log "Deleting old key $key_id"
      aws iam delete-access-key --user-name "$user" --access-key-id "$key_id" >/dev/null
    fi
  done

  cat <<EOF
New access key created for $user
  AWS_ACCESS_KEY_ID=$new_key_id
  AWS_SECRET_ACCESS_KEY=$new_secret
Store these credentials securely (e.g., GitHub Actions secrets) and remove them from console history.
EOF
}

main() {
  local region="ap-south-1"
  local github_org=""
  local github_repo=""
  local cicd_user=""
  local rotate="false"
  local dynamodb_table_arn=""
  local secrets_prefix="arn:aws:secretsmanager:*:*:secret:asharvi/backend/*"
  local log_group_arn="arn:aws:logs:*:*:log-group:/aws/ecs/asharvi-backend*"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -r|--region)
        region="$2"; shift 2 ;;
      --github-org)
        github_org="$2"; shift 2 ;;
      --github-repo)
        github_repo="$2"; shift 2 ;;
      --cicd-iam-user)
        cicd_user="$2"; shift 2 ;;
      --rotate)
        rotate="true"; shift 1 ;;
      --dynamodb-table-arn)
        dynamodb_table_arn="$2"; shift 2 ;;
      --secrets-prefix)
        secrets_prefix="$2"; shift 2 ;;
      --log-group-arn)
        log_group_arn="$2"; shift 2 ;;
      -h|--help)
        usage; exit 0 ;;
      *)
        echo "Unknown option: $1" >&2
        usage
        exit 1 ;;
    esac
  done

  export AWS_REGION="$region"

  require_command aws
  require_command jq

  log "Using region: $region"

  local account_id
  account_id=$(aws sts get-caller-identity --query 'Account' --output text)
  log "Detected account: $account_id"

  # Assemble assume role policies
  local task_assume_policy
  task_assume_policy=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
)

  local execution_assume_policy="$task_assume_policy"

  # Task role inline policy
  local task_statements
  task_statements=$(cat <<EOF
[
  {
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": ["$secrets_prefix"]
  },
  {
    "Effect": "Allow",
    "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
    "Resource": ["$log_group_arn:*"]
  }
EOF
)

  if [[ -n "$dynamodb_table_arn" ]]; then
    task_statements=$(cat <<EOF
$task_statements,
  {
    "Effect": "Allow",
    "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query", "dynamodb:Scan"],
    "Resource": ["$dynamodb_table_arn"]
  }
EOF
)
  fi

  task_statements+=$'\n]'

  local task_policy
  task_policy=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": $task_statements
}
EOF
)

  ensure_role "AsharviBackendEcsTaskRole" "$task_assume_policy" "AsharviBackendTaskPolicy" "$task_policy"

  # Execution role policy
  local execution_policy
  execution_policy=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/ecs/*"
    }
  ]
}
EOF
)

  ensure_role "AsharviBackendEcsExecutionRole" "$execution_assume_policy" "AsharviBackendExecutionPolicy" "$execution_policy"

  # CI/CD deploy role updates (if requested)
  if [[ -n "$github_org" && -n "$github_repo" ]]; then
    local cicd_role="AsharviCicdDeployRole"
    log "Updating trust relationship for $cicd_role"
    local trust_policy
    trust_policy=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::$account_id:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:$github_org/$github_repo:*"
        }
      }
    }
  ]
}
EOF
)

    if aws iam get-role --role-name "$cicd_role" >/dev/null 2>&1; then
      aws iam update-assume-role-policy --role-name "$cicd_role" --policy-document "$trust_policy" >/dev/null
      log "Applied GitHub OIDC trust to $cicd_role"

      local deploy_policy
      deploy_policy=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServices",
        "ecs:UpdateService",
        "ecs:RegisterTaskDefinition",
        "ecs:DescribeTaskDefinition"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["iam:PassRole"],
      "Resource": [
        "arn:aws:iam::$account_id:role/AsharviBackendEcsExecutionRole",
        "arn:aws:iam::$account_id:role/AsharviBackendEcsTaskRole"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeImages",
        "ecr:GetDownloadUrlForLayer",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": ["$secrets_prefix"]
    },
    {
      "Effect": "Allow",
      "Action": ["logs:DescribeLogGroups"],
      "Resource": "*"
    }
  ]
}
EOF
)

      aws iam put-role-policy --role-name "$cicd_role" --policy-name AsharviCicdDeployPermissions --policy-document "$deploy_policy" >/dev/null
      log "Updated inline policy for $cicd_role"
    else
      log "Warning: $cicd_role does not exist; skipping trust update"
    fi
  fi

  if [[ "$rotate" == "true" ]]; then
    if [[ -z "$cicd_user" ]]; then
      echo "Error: --rotate requires --cicd-iam-user" >&2
      exit 1
    fi
    rotate_access_keys "$cicd_user"
  fi

  log "Backend IAM setup complete"
}

main "$@"
