import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();



async function main() {
  console.log("Seeding database...");

  // Create default permissions
  const roles = ["ADMIN", "MANAGER", "AGENT", "ACCOUNTS", "CLAIMS_OFFICER"];
  const modules = ["clients", "proposals", "alterations", "payments", "claims", "reports", "users", "settings"];

  for (const role of roles) {
    for (const module of modules) {
      await prisma.permission.upsert({
        where: { role_module: { role, module } },
        update: {},
        create: {
          role,
          module,
          canCreate: role === "ADMIN" || (role === "AGENT" && ["clients", "proposals", "alterations"].includes(module)) || (role === "ACCOUNTS" && module === "payments") || (role === "CLAIMS_OFFICER" && module === "claims"),
          canRead: true,
          canUpdate: role === "ADMIN" || role === "MANAGER" || (role === "AGENT" && ["clients", "proposals"].includes(module)) || (role === "ACCOUNTS" && module === "payments") || (role === "CLAIMS_OFFICER" && module === "claims"),
          canDelete: role === "ADMIN",
          canApprove: role === "ADMIN" || role === "MANAGER" || (role === "CLAIMS_OFFICER" && module === "claims"),
          canExport: role === "ADMIN" || role === "MANAGER" || role === "ACCOUNTS",
        },
      });
    }
  }

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@royaltyfuneral.co.za" },
    update: {},
    create: {
      email: "admin@royaltyfuneral.co.za",
      password: adminPassword,
      firstName: "System",
      lastName: "Administrator",
      phone: "011 123 4567",
      role: "ADMIN",
      isActive: true,
    },
  });

  // Create sample users
  const agentPassword = await bcrypt.hash("agent123", 12);
  const users = [
    { email: "john.d@royaltyfuneral.co.za", firstName: "John", lastName: "Dlamini", role: "AGENT" },
    { email: "sarah.n@royaltyfuneral.co.za", firstName: "Sarah", lastName: "Nkosi", role: "AGENT" },
    { email: "peter.z@royaltyfuneral.co.za", firstName: "Peter", lastName: "Zulu", role: "MANAGER" },
    { email: "finance@royaltyfuneral.co.za", firstName: "Mary", lastName: "Mbeki", role: "ACCOUNTS" },
    { email: "claims@royaltyfuneral.co.za", firstName: "James", lastName: "Sithole", role: "CLAIMS_OFFICER" },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        password: agentPassword,
        phone: "011 123 4567",
        isActive: true,
      },
    });
  }

  // Create plan configurations
  const plans = [
    {
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
      features: JSON.stringify(["Basic coffin", "Hearse", "4 chairs", "Basic tent"]),
      sortOrder: 1,
    },
    {
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
      features: JSON.stringify(["Quality coffin", "Hearse", "50 chairs", "10x10 tent", "Basic catering"]),
      sortOrder: 2,
    },
    {
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
      features: JSON.stringify(["Premium coffin", "Luxury hearse", "100 chairs", "2 tents", "Full catering", "Programs"]),
      sortOrder: 3,
    },
    {
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
      features: JSON.stringify(["Executive coffin", "Luxury hearse fleet", "200 chairs", "3 tents", "Full catering", "Programs", "Flowers", "Tombstone contribution"]),
      sortOrder: 4,
    },
  ];

  for (const plan of plans) {
    await prisma.planConfig.upsert({
      where: { planType: plan.planType },
      update: plan,
      create: plan,
    });
  }

  // Create system settings
  const settings = [
    { key: "company_name", value: "Royalty Funeral Services", category: "GENERAL" },
    { key: "company_phone", value: "011 123 4567", category: "GENERAL" },
    { key: "company_email", value: "info@royaltyfuneral.co.za", category: "GENERAL" },
    { key: "waiting_period_natural", value: "180", category: "POLICY", description: "Natural death waiting period in days" },
    { key: "waiting_period_accident", value: "0", category: "POLICY", description: "Accidental death waiting period in days" },
    { key: "grace_period_days", value: "30", category: "PAYMENT", description: "Payment grace period before policy lapses" },
    { key: "renewal_reminder_days", value: "7", category: "NOTIFICATION", description: "Days before renewal to send reminder" },
    { key: "require_proposal_approval", value: "true", category: "WORKFLOW" },
    { key: "require_claim_approval", value: "true", category: "WORKFLOW" },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  // Get admin user for creating sample data
  const admin = await prisma.user.findUnique({ where: { email: "admin@royaltyfuneral.co.za" } });
  const agent = await prisma.user.findUnique({ where: { email: "john.d@royaltyfuneral.co.za" } });

  if (admin && agent) {
    // Create sample clients
    const sampleClients = [
      {
        clientNumber: "RFS-20260101-0001",
        title: "Mr",
        firstName: "Thabo",
        lastName: "Mokoena",
        idNumber: "8501015800085",
        dateOfBirth: new Date("1985-01-01"),
        gender: "Male",
        maritalStatus: "Married",
        phone: "082 123 4567",
        email: "thabo.m@email.com",
        streetAddress: "45 Nelson Mandela Drive",
        suburb: "Sandton",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2196",
      },
      {
        clientNumber: "RFS-20260102-0002",
        title: "Mrs",
        firstName: "Nomvula",
        lastName: "Sithole",
        idNumber: "9003155800086",
        dateOfBirth: new Date("1990-03-15"),
        gender: "Female",
        maritalStatus: "Married",
        phone: "083 234 5678",
        email: "nomvula.s@email.com",
        streetAddress: "12 Church Street",
        suburb: "Pretoria Central",
        city: "Pretoria",
        province: "Gauteng",
        postalCode: "0001",
      },
      {
        clientNumber: "RFS-20260103-0003",
        title: "Mr",
        firstName: "Sipho",
        lastName: "Ndlovu",
        idNumber: "7805205800087",
        dateOfBirth: new Date("1978-05-20"),
        gender: "Male",
        maritalStatus: "Single",
        phone: "084 345 6789",
        email: "sipho.n@email.com",
        streetAddress: "78 Voortrekker Road",
        suburb: "Bellville",
        city: "Cape Town",
        province: "Western Cape",
        postalCode: "7530",
      },
    ];

    for (const clientData of sampleClients) {
      const existingClient = await prisma.client.findFirst({
        where: { idNumber: clientData.idNumber },
      });

      if (!existingClient) {
        const client = await prisma.client.create({ data: clientData });

        // Create policy for each client
        const planTypes = ["GOLD", "PURPLE", "BLUE"];
        const planType = planTypes[sampleClients.indexOf(clientData)];
        const planConfig = plans.find((p) => p.planType === planType)!;

        await prisma.policy.create({
          data: {
            policyNumber: `POL-20260${sampleClients.indexOf(clientData) + 1}01-000${sampleClients.indexOf(clientData) + 1}`,
            clientId: client.id,
            policyType: "FAMILY",
            planType,
            coverAmount: planConfig.principalCover,
            premiumAmount: planConfig.basePremium,
            inceptionDate: new Date("2026-01-01"),
            effectiveDate: new Date("2026-01-01"),
            renewalDate: new Date("2027-01-01"),
            waitingPeriodEnd: new Date("2026-07-01"),
            status: "ACTIVE",
            paymentFrequency: "MONTHLY",
            paymentMethod: "DEBIT_ORDER",
            debitOrderDay: 1,
          },
        });

        // Create proposal record
        await prisma.proposal.create({
          data: {
            proposalNumber: `PROP-20260${sampleClients.indexOf(clientData) + 1}01-000${sampleClients.indexOf(clientData) + 1}`,
            clientId: client.id,
            agentId: agent.id,
            policyType: "FAMILY",
            planType,
            proposedCover: planConfig.principalCover,
            proposedPremium: planConfig.basePremium,
            clientTitle: clientData.title,
            clientFirstName: clientData.firstName,
            clientLastName: clientData.lastName,
            clientIdNumber: clientData.idNumber,
            clientDOB: clientData.dateOfBirth,
            clientGender: clientData.gender,
            clientPhone: clientData.phone,
            clientEmail: clientData.email || "",
            clientAddress: clientData.streetAddress,
            clientCity: clientData.city,
            clientPostalCode: clientData.postalCode || "",
            paymentFrequency: "MONTHLY",
            paymentMethod: "DEBIT_ORDER",
            status: "APPROVED",
            submittedAt: new Date("2025-12-15"),
            approvedAt: new Date("2025-12-20"),
          },
        });
      }
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
