export const DEFAULT_PLANS = {
    BASIC: {
      name: "Basic Policy",
      benefits: ["Repatriation up to 600km"],
      cashBenefit: 450,
      ageTiers: [
        {
          label: "18 - 64",
          minAge: 18,
          maxAge: 64,
          options: { SINGLE: 2.5, MEMBER_SPOUSE: 3, FAMILY: 3.5, EXTENDED_FAMILY: 3.5 },
          dependents: { CHILD: 3 }
        }
      ]
    },
    BRONZE: {
      name: "Bronze Policy",
      benefits: ["1 Tier Casket", "Burial Services", "Complimentary Grocery", "Transport (15 Seater Quantum)", "Grave Tent and Chairs", "Repatriation (Over 600km)"],
      cashBenefit: 450,
      ageTiers: [
        {
          label: "18 - 64",
          minAge: 18,
          maxAge: 64,
          options: { SINGLE: 3.5, MEMBER_SPOUSE: 5, FAMILY: 5.5, EXTENDED_FAMILY: 1.5 },
          dependents: { CHILD: 4 }
        },
        {
          label: "65 - 74",
          minAge: 65,
          maxAge: 74,
          options: { SINGLE: 4, MEMBER_SPOUSE: 6, FAMILY: 7, EXTENDED_FAMILY: 3 },
          dependents: { CHILD: 5 }
        },
        {
          label: "75 - 84",
          minAge: 75,
          maxAge: 84,
          options: { SINGLE: 11, MEMBER_SPOUSE: 8.5, FAMILY: 0, EXTENDED_FAMILY: 11 },
          dependents: { CHILD: 0 }
        }
      ]
    },
    SILVER: {
      name: "Royalty Silver",
      benefits: ["1 Tier Casket", "Burial Services", "Complimentary Grocery", "Transport (15 Seater Quantum)", "Grave Tent and Chairs", "Airtime", "Repatriation (Over 600km)"],
      cashBenefit: 550,
      ageTiers: [
        {
          label: "18 - 64",
          minAge: 18,
          maxAge: 64,
          options: { SINGLE: 3.5, MEMBER_SPOUSE: 6, FAMILY: 8.5, EXTENDED_FAMILY: 2 },
          dependents: { CHILD: 5 }
        },
        {
          label: "65 - 74",
          minAge: 65,
          maxAge: 74,
          options: { SINGLE: 4.5, MEMBER_SPOUSE: 7.5, FAMILY: 9.5, EXTENDED_FAMILY: 4.5 },
          dependents: { CHILD: 6 }
        },
        {
          label: "75 - 84",
          minAge: 75,
          maxAge: 84,
          options: { SINGLE: 11.5, MEMBER_SPOUSE: 9, FAMILY: 0, EXTENDED_FAMILY: 12 },
          dependents: { CHILD: 0 }
        }
      ]
    },
    GOLD: {
      name: "Royalty Gold",
      benefits: ["3 Tier Casket", "Burial Services", "Complimentary Grocery", "Transport (15 Seater Quantum)", "Grave Tent and Chairs", "Airtime", "Repatriation (Over 600km)"],
      cashBenefit: 700,
      ageTiers: [
        {
          label: "18 - 64",
          minAge: 18,
          maxAge: 64,
          options: { SINGLE: 5.5, MEMBER_SPOUSE: 10.5, FAMILY: 11.5, EXTENDED_FAMILY: 10.5 },
          dependents: { CHILD: 9.5 }
        },
        {
          label: "65 - 74",
          minAge: 65,
          maxAge: 74,
          options: { SINGLE: 8, MEMBER_SPOUSE: 23.5, FAMILY: 0, EXTENDED_FAMILY: 11.5 },
          dependents: { CHILD: 0 }
        },
        {
          label: "75 - 84",
          minAge: 75,
          maxAge: 84,
          options: { SINGLE: 8.5, MEMBER_SPOUSE: 47, FAMILY: 0, EXTENDED_FAMILY: 12 },
          dependents: { CHILD: 0 }
        }
      ]
    },
    OPTIONAL_BENEFITS: {
      ACCIDENTAL_DEATH: [
        { id: "adb_750", cover: 750, premium: 5 },
        { id: "adb_1500", cover: 1500, premium: 7.5 },
        { id: "adb_2000", cover: 2000, premium: 10 }
      ],
      SPOUSAL_DEATH: [
        { id: "sdb_300", cover: 300, premium: 5 },
        { id: "sdb_600", cover: 600, premium: 10 }
      ]
    }
  };
  
