import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // This console lists every tenant, licence key and customer contact.
    // With open sign-up anyone on the internet could register and read it.
    // Staff are provisioned with scripts/seed-admin.cjs instead.
    disableSignUp: true,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "SALES_AGENT",
        input: false,
      },
    },
  },
})
