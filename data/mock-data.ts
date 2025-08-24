import type { Project, Team, User, GlobalAttribute, FeatureFlag, ChangeLog, ApprovalRequest } from "../types"

export const mockData = {
  users: [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com" },
    { id: "4", name: "Alice Johnson", email: "alice@example.com" },
  ] as User[],

  teams: [
    {
      id: "1",
      name: "Frontend Team",
      members: [
        { userId: "1", role: "owner" as const },
        { userId: "2", role: "editor" as const },
        { userId: "3", role: "viewer" as const },
      ],
    },
    {
      id: "2",
      name: "Backend Team",
      members: [
        { userId: "2", role: "owner" as const },
        { userId: "4", role: "editor" as const },
      ],
    },
  ] as Team[],

  projects: [
    {
      id: "1",
      key: "e_commerce_platform",
      name: "E-commerce Platform",
      description: "Main e-commerce application",
      teamIds: ["1", "2"],
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
    },
    {
      id: "2",
      key: "mobile_app",
      name: "Mobile App",
      description: "Mobile application for iOS and Android",
      teamIds: ["1"],
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-05"),
    },
  ] as Project[],

  attributes: [
    {
      id: "1",
      name: "country",
      type: "string" as const,
      description: "User country code",
      possibleValues: ["US", "CA", "UK", "DE", "FR"],
    },
    {
      id: "2",
      name: "user_age",
      type: "number" as const,
      description: "User age in years",
    },
    {
      id: "3",
      name: "is_premium",
      type: "boolean" as const,
      description: "Whether user has premium subscription",
    },
    {
      id: "4",
      name: "customer_phone",
      type: "string" as const,
      description: "Customer phone number",
    },
    {
      id: "5",
      name: "user_id",
      type: "number" as const,
      description: "Unique user identifier for percentage splits",
    },
  ] as GlobalAttribute[],

  flags: [
    {
      id: "1",
      key: "new_checkout_flow",
      name: "New Checkout Flow",
      description: "Enable the redesigned checkout process",
      dataType: "boolean" as const,
      projectId: "1",
      environments: [
        {
          environment: "development" as const,
          enabled: true,
          defaultValue: false,
          rules: [
            {
              id: "1",
              name: "Premium users",
              conditions: [{ attributeId: "3", operator: "equals" as const, value: true }],
              logicalOperator: "AND" as const,
              returnValue: true,
              enabled: true,
            },
            {
              id: "4",
              name: "Country-based feature",
              conditions: [
                {
                  attributeId: "1",
                  operator: "in" as const,
                  value: "",
                  listValues: ["US", "CA", "UK"],
                },
              ],
              logicalOperator: "AND" as const,
              returnValue: true,
              enabled: true,
            },
            {
              id: "5",
              name: "Modulus-based rollout",
              conditions: [
                {
                  attributeId: "5",
                  operator: "modulus_equals" as const,
                  value: 0,
                  modulusValue: 10,
                },
              ],
              logicalOperator: "AND" as const,
              returnValue: true,
              enabled: true,
            },
          ],
          trafficSplits: [],
        },
        {
          environment: "production" as const,
          enabled: false,
          defaultValue: false,
          rules: [],
          trafficSplits: [
            { percentage: 10, value: true },
            { percentage: 90, value: false },
          ],
        },
      ],
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
      createdBy: "1",
    },
    {
      id: "2",
      key: "payment_methods",
      name: "Available Payment Methods",
      description: "List of available payment methods with A/B testing",
      dataType: "json" as const,
      projectId: "1",
      environments: [
        {
          environment: "development" as const,
          enabled: true,
          defaultValue: ["credit_card", "paypal"],
          rules: [
            {
              id: "2",
              name: "US users get more options",
              conditions: [{ attributeId: "1", operator: "equals" as const, value: "US" }],
              logicalOperator: "AND" as const,
              returnValue: ["credit_card", "paypal", "apple_pay", "google_pay"],
              enabled: true,
            },
            {
              id: "3",
              name: "A/B Test Payment Options",
              conditions: [],
              logicalOperator: "AND" as const,
              enabled: true,
              trafficSplits: [
                {
                  percentage: 50,
                  value: ["credit_card", "paypal"],
                  label: "Control Group",
                },
                {
                  percentage: 30,
                  value: ["credit_card", "paypal", "apple_pay"],
                  label: "Apple Pay Test",
                },
                {
                  percentage: 20,
                  value: ["credit_card", "paypal", "apple_pay", "google_pay"],
                  label: "Full Options",
                },
              ],
            },
          ],
          trafficSplits: [],
        },
      ],
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-05"),
      createdBy: "2",
    },
    {
      id: "3",
      key: "show_new_feature",
      name: "Show New Feature",
      description: "Boolean A/B test for new feature visibility",
      dataType: "boolean" as const,
      projectId: "1",
      environments: [
        {
          environment: "development" as const,
          enabled: true,
          defaultValue: false,
          rules: [
            {
              id: "6",
              name: "Feature A/B Test",
              conditions: [{ attributeId: "3", operator: "equals" as const, value: true }],
              logicalOperator: "AND" as const,
              enabled: true,
              trafficSplits: [
                {
                  percentage: 30,
                  value: true,
                  label: "Show Feature",
                },
                {
                  percentage: 70,
                  value: false,
                  label: "Hide Feature",
                },
              ],
            },
          ],
          trafficSplits: [],
        },
      ],
      createdAt: new Date("2024-02-10"),
      updatedAt: new Date("2024-02-12"),
      createdBy: "1",
    },
  ] as FeatureFlag[],

  changeLogs: [
    {
      id: "1",
      flagId: "1",
      projectId: "1",
      userId: "1",
      timestamp: new Date("2024-01-20T10:30:00"),
      action: "Updated rule conditions",
      beforeSnapshot: { enabled: false },
      afterSnapshot: { enabled: true },
      environment: "development" as const,
      description: "Enabled rule for premium users",
    },
    {
      id: "2",
      flagId: "2",
      projectId: "1",
      userId: "2",
      timestamp: new Date("2024-02-05T14:15:00"),
      action: "Created traffic split rule",
      beforeSnapshot: null,
      afterSnapshot: { key: "payment_methods", enabled: true },
      description: "Added A/B test for payment methods with traffic splits",
    },
  ] as ChangeLog[],

  approvals: [
    {
      id: "1",
      flagId: "1",
      projectId: "1",
      requestedBy: "2",
      requestedAt: new Date("2024-01-22T09:00:00"),
      status: "pending" as const,
      changes: {
        environment: "production",
        action: "enable_flag",
        newValue: true,
      },
    },
    {
      id: "2",
      flagId: "2",
      projectId: "1",
      requestedBy: "1",
      requestedAt: new Date("2024-02-06T11:30:00"),
      status: "approved" as const,
      reviewedBy: "2",
      reviewedAt: new Date("2024-02-06T15:45:00"),
      comments: "Looks good, approved for production deployment",
      changes: {
        environment: "production",
        action: "update_traffic_split",
        newValue: [
          { percentage: 60, value: ["credit_card", "paypal"], label: "Control" },
          { percentage: 40, value: ["credit_card", "paypal", "apple_pay"], label: "Test" },
        ],
      },
    },
  ] as ApprovalRequest[],
}
