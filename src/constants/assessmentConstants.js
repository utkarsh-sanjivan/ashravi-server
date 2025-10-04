const ASSESSMENT_CONSTANTS = {
  issues: {
    anxiety: {
      id: 'anxiety',
      name: 'Anxiety Disorder',
      thresholds: {
        weighted_average: {
          normal: { min: 0, max: 50 },
          borderline: { min: 50, max: 70 },
          clinical: { min: 70, max: 100 }
        },
        t_score: {
          normal: { min: 0, max: 65 },
          borderline: { min: 65, max: 70 },
          clinical: { min: 70, max: 100 }
        }
      },
      recommendedCourseId: '507f1f77bcf86cd799439021',
      professional: {
        name: 'Dr. Sarah Johnson',
        phone: '+1-555-0101',
        alternatePhone: '+1-555-0102',
        email: 'dr.johnson@mentalhealth.com',
        address: '123 Health Street, Mental Health Center, Suite 200'
      }
    },
    depression: {
      id: 'depression',
      name: 'Depression',
      thresholds: {
        weighted_average: {
          normal: { min: 0, max: 45 },
          borderline: { min: 45, max: 65 },
          clinical: { min: 65, max: 100 }
        },
        t_score: {
          normal: { min: 0, max: 65 },
          borderline: { min: 65, max: 70 },
          clinical: { min: 70, max: 100 }
        }
      },
      recommendedCourseId: '507f1f77bcf86cd799439022',
      professional: {
        name: 'Dr. Michael Chen',
        phone: '+1-555-0201',
        alternatePhone: '+1-555-0202',
        email: 'dr.chen@mentalhealth.com',
        address: '456 Wellness Ave, Behavioral Health Clinic, Floor 3'
      }
    },
    adhd: {
      id: 'adhd',
      name: 'ADHD',
      thresholds: {
        weighted_average: {
          normal: { min: 0, max: 55 },
          borderline: { min: 55, max: 75 },
          clinical: { min: 75, max: 100 }
        },
        t_score: {
          normal: { min: 0, max: 65 },
          borderline: { min: 65, max: 70 },
          clinical: { min: 70, max: 100 }
        }
      },
      recommendedCourseId: '507f1f77bcf86cd799439023',
      professional: {
        name: 'Dr. Emily Roberts',
        phone: '+1-555-0301',
        alternatePhone: '+1-555-0302',
        email: 'dr.roberts@adhd center.com',
        address: '789 Focus Lane, ADHD Specialty Clinic'
      }
    },
    ocd: {
      id: 'ocd',
      name: 'OCD',
      thresholds: {
        weighted_average: {
          normal: { min: 0, max: 48 },
          borderline: { min: 48, max: 68 },
          clinical: { min: 68, max: 100 }
        },
        t_score: {
          normal: { min: 0, max: 65 },
          borderline: { min: 65, max: 70 },
          clinical: { min: 70, max: 100 }
        }
      },
      recommendedCourseId: '507f1f77bcf86cd799439024',
      professional: {
        name: 'Dr. David Martinez',
        phone: '+1-555-0401',
        alternatePhone: '+1-555-0402',
        email: 'dr.martinez@ocdcenter.com',
        address: '321 Calm Street, OCD Treatment Center'
      }
    },
    social_phobia: {
      id: 'social_phobia',
      name: 'Social Phobia',
      thresholds: {
        weighted_average: {
          normal: { min: 0, max: 50 },
          borderline: { min: 50, max: 70 },
          clinical: { min: 70, max: 100 }
        },
        t_score: {
          normal: { min: 0, max: 65 },
          borderline: { min: 65, max: 70 },
          clinical: { min: 70, max: 100 }
        }
      },
      recommendedCourseId: '507f1f77bcf86cd799439025',
      professional: {
        name: 'Dr. Lisa Anderson',
        phone: '+1-555-0501',
        alternatePhone: '+1-555-0502',
        email: 'dr.anderson@socialphobia.com',
        address: '654 Confidence Blvd, Social Anxiety Clinic'
      }
    }
  },

  methods: {
    WEIGHTED_AVERAGE: 'weighted_average',
    T_SCORE_NON_WEIGHTED: 't_score_non_weighted',
    T_SCORE_WEIGHTED: 't_score_weighted'
  },

  severityLevels: {
    NORMAL: 'normal',
    BORDERLINE: 'borderline',
    CLINICAL: 'clinical'
  },

  tScoreStatistics: {
    anxiety: { mean: 50, stdDev: 10 },
    depression: { mean: 50, stdDev: 10 },
    adhd: { mean: 50, stdDev: 10 },
    ocd: { mean: 50, stdDev: 10 },
    social_phobia: { mean: 50, stdDev: 10 }
  }
};

module.exports = ASSESSMENT_CONSTANTS;
