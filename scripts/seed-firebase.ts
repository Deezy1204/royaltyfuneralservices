
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD5LKvzB06HRRZQBd3miB8M0ynOiute3CI",
    authDomain: "royaltyfuneralweb.firebaseapp.com",
    databaseURL: "https://royaltyfuneralweb-default-rtdb.firebaseio.com",
    projectId: "royaltyfuneralweb",
    storageBucket: "royaltyfuneralweb.firebasestorage.app",
    messagingSenderId: "593789199355",
    appId: "1:593789199355:web:cc86524165e5744adbe15e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const PLANS = {
    WHITE: {
        planType: "WHITE",
        displayName: "White Plan",
        description: "Basic funeral cover",
        principalCover: 15000,
        spouseCover: 10000,
        childCover: 7500,
        parentCover: 7500,
        extendedCover: 5000,
        basePremium: 150,
        spousePremium: 75,
        childPremium: 35,
        parentPremium: 60,
        extendedPremium: 40,
        maxDependents: 6,
        maxParents: 4,
        maxExtended: 4,
        features: ["Basic coffin", "Hearse", "4 chairs", "Basic tent"],
        sortOrder: 1,
    },
    GOLD: {
        planType: "GOLD",
        displayName: "Gold Plan",
        description: "Standard funeral cover with extras",
        principalCover: 25000,
        spouseCover: 17500,
        childCover: 12500,
        parentCover: 12500,
        extendedCover: 7500,
        basePremium: 250,
        spousePremium: 100,
        childPremium: 50,
        parentPremium: 80,
        extendedPremium: 60,
        maxDependents: 8,
        maxParents: 4,
        maxExtended: 6,
        features: ["Quality coffin", "Hearse", "50 chairs", "10x10 tent", "Basic catering"],
        sortOrder: 2,
    },
    BLUE: {
        planType: "BLUE",
        displayName: "Blue Plan",
        description: "Premium funeral cover",
        principalCover: 35000,
        spouseCover: 25000,
        childCover: 17500,
        parentCover: 17500,
        extendedCover: 10000,
        basePremium: 350,
        spousePremium: 125,
        childPremium: 65,
        parentPremium: 100,
        extendedPremium: 75,
        maxDependents: 10,
        maxParents: 6,
        maxExtended: 6,
        features: ["Premium coffin", "Luxury hearse", "100 chairs", "2 tents", "Full catering", "Programs"],
        sortOrder: 3,
    },
    PURPLE: {
        planType: "PURPLE",
        displayName: "Purple Plan",
        description: "Executive funeral cover",
        principalCover: 50000,
        spouseCover: 35000,
        childCover: 25000,
        parentCover: 25000,
        extendedCover: 15000,
        basePremium: 500,
        spousePremium: 175,
        childPremium: 85,
        parentPremium: 140,
        extendedPremium: 100,
        maxDependents: 12,
        maxParents: 8,
        maxExtended: 8,
        features: ["Executive coffin", "Luxury hearse fleet", "200 chairs", "3 tents", "Full catering", "Programs", "Flowers", "Tombstone contribution"],
        sortOrder: 4,
    },
};

const SETTINGS = {
    company_name: { value: "Royalty Funeral Services", category: "GENERAL" },
    company_phone: { value: "011 123 4567", category: "GENERAL" },
    company_email: { value: "info@royaltyfuneral.co.za", category: "GENERAL" },
    waiting_period_natural: { value: "180", category: "POLICY", description: "Natural death waiting period in days" },
    waiting_period_accident: { value: "0", category: "POLICY", description: "Accidental death waiting period in days" },
    grace_period_days: { value: "30", category: "PAYMENT", description: "Payment grace period before policy lapses" },
    renewal_reminder_days: { value: "7", category: "NOTIFICATION", description: "Days before renewal to send reminder" },
    require_proposal_approval: { value: "true", category: "WORKFLOW" },
    require_claim_approval: { value: "true", category: "WORKFLOW" },
};

async function seed() {
    console.log("Starting Firebase seed...");

    try {
        // 1. Clear Database
        console.log("Clearing existing data...");
        await set(ref(db), {});

        // 2. Set Plan Configs
        console.log("Seeding Plan Configs...");
        await set(ref(db, "plans"), PLANS);

        // 3. Set System Settings
        console.log("Seeding System Settings...");
        await set(ref(db, "settings"), SETTINGS);

        // 4. Create Users (We will mimic storing them in DB for easy access, but Auth is separate)
        // Note: Creating users in Firebase Auth requires Admin SDK or client side flow. 
        // For this seed script running locally, we can't easily use Admin SDK without service account key file.
        // We will just populate the 'users' node in RTDB. 
        // The actual Auth accounts need to be created manually or via the app's sign-up flow if we don't have Admin SDK.
        // However, to make it usable, we'll create a dummy entry.

        const USERS = {
            "admin_user_id": {
                firstName: "System",
                lastName: "Administrator",
                email: "admin@royaltyfuneral.co.za",
                role: "ADMIN",
                phone: "011 123 4567",
                isActive: true,
                createdAt: new Date().toISOString()
            },
            "agent_user_id": {
                firstName: "John",
                lastName: "Dlamini",
                email: "john.d@royaltyfuneral.co.za",
                role: "AGENT",
                phone: "011 123 4567",
                isActive: true,
                createdAt: new Date().toISOString()
            }
        };

        console.log("Seeding Users (RTDB only)...");
        await set(ref(db, "users"), USERS);

        // 5. Create Template Clients & Policies
        console.log("Seeding Clients & Policies...");

        const client1Id = "client_1";
        const client2Id = "client_2";

        const CLIENTS = {
            [client1Id]: {
                id: client1Id,
                clientNumber: "RFS-20260101-0001",
                title: "Mr",
                firstName: "Thabo",
                lastName: "Mokoena",
                idNumber: "8501015800085",
                dateOfBirth: "1985-01-01T00:00:00.000Z",
                gender: "Male",
                maritalStatus: "Married",
                phone: "082 123 4567",
                email: "thabo.m@email.com",
                streetAddress: "45 Nelson Mandela Drive",
                suburb: "Sandton",
                city: "Johannesburg",
                province: "Gauteng",
                postalCode: "2196",
                isActive: true,
                createdAt: new Date().toISOString()
            },
            [client2Id]: {
                id: client2Id,
                clientNumber: "RFS-20260102-0002",
                title: "Mrs",
                firstName: "Nomvula",
                lastName: "Sithole",
                idNumber: "9003155800086",
                dateOfBirth: "1990-03-15T00:00:00.000Z",
                gender: "Female",
                maritalStatus: "Married",
                phone: "083 234 5678",
                email: "nomvula.s@email.com",
                streetAddress: "12 Church Street",
                suburb: "Pretoria Central",
                city: "Pretoria",
                province: "Gauteng",
                postalCode: "0001",
                isActive: true,
                createdAt: new Date().toISOString()
            }
        };

        await set(ref(db, "clients"), CLIENTS);

        const POLICIES = {
            "policy_1": {
                id: "policy_1",
                policyNumber: "POL-20260101-0001",
                clientId: client1Id,
                policyType: "FAMILY",
                planType: "GOLD",
                coverAmount: 25000,
                premiumAmount: 250,
                status: "ACTIVE",
                inceptionDate: "2026-01-01T00:00:00.000Z",
                createdAt: new Date().toISOString()
            },
            "policy_2": {
                id: "policy_2",
                policyNumber: "POL-20260102-0002",
                clientId: client2Id,
                policyType: "FAMILY",
                planType: "PURPLE",
                coverAmount: 50000,
                premiumAmount: 500,
                status: "ACTIVE",
                inceptionDate: "2026-01-01T00:00:00.000Z",
                createdAt: new Date().toISOString()
            }
        };

        await set(ref(db, "policies"), POLICIES);

        console.log("Seeding completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
