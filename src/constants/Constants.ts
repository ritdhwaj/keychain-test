export const Constants = {
    // Timeouts
    TIMEOUT: {
        SHORT: 10000,
        MEDIUM: 30000,
        LONG: 60000
    },
   WAIT:{
      WaitForOneSecond: 1000,
      WaitForTwoSeconds: 2000,
      WaitForThreeSeconds: 3000,
      WaitForFiveSeconds: 5000,
      WaitForSevenSeconds: 7000,
      WaitForTenSeconds: 10000,
      WaitForFifteenSeconds: 15000,
      WaitForTwentySeconds: 20000,
      WaitForThirtySeconds: 30000,
      WaitForSixtySeconds: 60000
   },
    // Messages
    MESSAGES: {
        LOGIN_SUCCESS: 'Successfully logged in',
        LOGIN_FAILED: 'Login failed',
        INVALID_OTP: 'Invalid OTP',
        SESSION_EXPIRED: 'Session expired',
        ONBOARDING_SUCCESS: 'Onboarding completed successfully',
        NAVIGATION_SUCCESS: 'Navigation successful',
        ADMIN_LOGIN_SUCCESS: 'Successfully logged into admin portal',
        ADMIN_LOGIN_FAILED: 'Failed to login to admin portal',
        DASHBOARD_VISIBLE: 'Dashboard is visible after login'
    },

    // Batch Test Data
    BATCH: {
        DEFAULT_PRICE: '₹ 299',
        BATCH_TYPES: ['E_BATCH', 'REGULAR'] as const,
        BATCH_MODES: ['ONLINE', 'OFFLINE', 'HYBRID'] as const,
        SEARCH_TIMEOUT: 5000
    },

    // Curious Jr specific constants
    CJR: {
        COURSES: {
            MENTAL_MATHS: 'Mental Maths',
            ENGLISH_CAMBRIDGE: 'Learn English by Cambridge',
            SCHOOL_CURRICULUM: 'School Curriculum'
        },
        CLASSES: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'] as const,
        COHORTS: {
            HINDI: 'Hindi sg NOT NEW',
            ENGLISH: 'English NEW'
        }
    },

    // Power Batch Test Data
    POWER_BATCH: {
        DEMO_CLASS: {
            TIME: '04:00 pm',
            DURATION: '7 hrs',
            SUBJECT: 'Indain Polity',
            DATE: 'Fri, 10 Oct',
            TIME_RANGE: '4:00 PM - 11:00 PM'
        },
        PAYMENT_PAGE_TEXTS: {
            SELECT_PAYMENT: 'Select a Payment Option',
            ORDER_SUMMARY: 'Order Summary',
            PAYMENT_SUMMARY: 'Payment Summary',
            ITEMS_IN_CART: 'Items In Cart'
        },
        FILTERS: {
            EXAMS: {
                IIT_JEE: 'IIT-JEE',
                NEET: 'NEET'
            },
            CLASSES: {
                CLASS_11: '11',
                CLASS_12: '12',
                CLASS_13: '13'
            },
            LANGUAGES: {
                ENGLISH: 'English',
                HINDI: 'Hindi',
                HINGLISH: 'Hinglish'
            }
        }
    },

    // Test User Credentials
    TEST_USER: {
        MOBILE_NUMBER: process.env.TEST_MOBILE_NUMBER || '8007004321',
        OTP: process.env.TEST_OTP || '424465'
    },

    // Khazana Test Data
    KHAZANA: {
        BATCH_NAME: 'Arjuna jee',
        SECTIONS: {
            ALL_COURSES: 'All Courses',
            CONTINUE_LEARNING: 'Continue Learning',
            BROWSE_BY_TEACHERS: 'Browse By Teachers'
        },
        TABS: {
            PODCAST: 'podcast',
            LECTURES: 'Lectures',
            NOTES: 'Notes',
            DPP: 'Dpp\'s',
            DPP_SOL: 'Dpp\'s Sol'
        },
        HEADINGS: {
            KHAZANA: 'Khazana',
            ALL_COURSES: 'All Courses'
        }
    },

    // AI Guru Test Data
    AIGURU: {
        TRIGGER_BUTTON: 'Hi, I am your Personal AI',
        TOUR: {
            WIDGET_ICON: 'AiGuruWidgetIcon',
            HEADING: 'About this Feature',
            SKIP_BUTTON: '[data-test-id="button-skip"]'
        },
        HEADINGS: {
            AI_GURU: 'AI Guru',
            WELCOME_MESSAGE: 'Hi, Want to solve a fun'
        },
        MODES: {
            ACADEMIC: 'Academic'
        },
        PLACEHOLDERS: {
            CHAT_INPUT: 'Type your doubt here'
        },
        TEST_QUESTIONS: {
            VALENCY: 'What is Valency ?',
            VELOCITY: 'What is Velocity ?'
        },
        LANGUAGES: {
            HINGLISH: 'hinglish',
            HINDI: 'Hindi',
            ENGLISH: 'English'
        },
        ACTIONS: {
            COPY: 'Copy',
            DELETE: 'Delete',
            CHANGE_LANGUAGE: 'Change Language'
        },
        CONFIRMATION: {
            DELETE_MESSAGE: 'Are you sure you want to'
        }
    },
    
    // Test Users
    TEST_USERS: {
        PRODUCTION: {
            MOBILE: '6788888897',
            OTP: '424465'
        },
        STAGING: {
            MOBILE: '6788888891',
            OTP: '123456'
        },
        // Legacy - keep for backward compatibility
        DESCRIPTION_TAB_USER: {
            MOBILE: '6788888897',
            OTP: '424465'
        }
    },

    AUTH:{
        CLIENT_ID: 'system-admin',
        GRANT_TYPE: 'password',
    },

};

export const VPConstants = {
    RESCHEDULE: {
      ONLINE_REASON: "Online Mode: Rescheduling is allowed."
    }
}

export const HeaderKeys = {
    ERP_SECRET: "erp-secret",
}

/**
 * Get environment-specific test credentials
 * @param env - Environment name (production, staging, etc.)
 * @returns Test credentials for the specified environment
 */
export const getTestCredentials = (env: string = 'staging') => {
    const environment = env.toLowerCase();
    if (environment === 'production') {
        return Constants.TEST_USERS.PRODUCTION;
    }
    return Constants.TEST_USERS.STAGING;
};
// decode function
export function decode(encodedStr: string): string {
    return Buffer.from(encodedStr, 'base64').toString('utf-8');
}