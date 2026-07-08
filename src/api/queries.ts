import { gql } from '@apollo/client';

// ─── TENANTS / COMPANIES ───────────────────────────────────────────────────────
export const GET_COMPANIES = gql`
  query GetCompanies($search: String, $page: Int, $pageSize: Int) {
    companies(search: $search, page: $page, pageSize: $pageSize) {
      items {
        id
        name
        slug
        logoUrl
        primaryColor
        coverImageUrl
        description
        city
        country
        rating
        totalDrivers
        totalTrucks
        isVerified
        planTier
        activeJobsCount
      }
      totalCount
      page
      pageSize
      hasNextPage
    }
  }
`;

export const GET_COMPANY = gql`
  query GetCompany($slug: String!) {
    company(slug: $slug) {
      id
      name
      slug
      logoUrl
      coverImageUrl
      description
      city
      country
      rating
      totalDrivers
      totalTrucks
      isVerified
      planTier
      phone
      email
      website
      activeJobsCount
      services
      foundedYear
    }
  }
`;

// ─── JOBS ──────────────────────────────────────────────────────────────────────
export const GET_JOBS = gql`
  query GetJobs($search: String, $companyId: ID, $page: Int, $pageSize: Int, $status: String) {
    jobs(search: $search, companyId: $companyId, page: $page, pageSize: $pageSize, status: $status) {
      items {
        id
        title
        company {
          id
          name
          logoUrl
          city
          country
        }
        location
        jobType
        salaryMin
        salaryMax
        currency
        experienceYears
        licenseClass
        deadline
        status
        description
        requirements
        postedAt
      }
      totalCount
      page
      pageSize
      hasNextPage
    }
  }
`;

export const GET_JOB = gql`
  query GetJob($id: ID!) {
    job(id: $id) {
      id
      title
      company {
        id
        name
        logoUrl
        city
        country
        phone
        email
      }
      location
      jobType
      salaryMin
      salaryMax
      currency
      experienceYears
      licenseClass
      deadline
      status
      description
      requirements
      benefits
      postedAt
      applicantsCount
    }
  }
`;

// ─── AUTH ──────────────────────────────────────────────────────────────────────
export const CHECK_EMAIL_EXISTS = gql`
  query CheckEmailExists($email: String!) {
    checkEmailExists(email: $email) {
      exists
    }
  }
`;

export const CHECK_PHONE_EXISTS = gql`
  query CheckPhoneExists($phone: String!) {
    checkPhoneExists(phone: $phone) {
      exists
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      firstName
      lastName
      role
      tenantId
      avatar
      phone
      isActive
      createdAt
    }
  }
`;

// ─── DRIVER DASHBOARD ──────────────────────────────────────────────────────────
export const GET_DRIVER_DASHBOARD = gql`
  query GetDriverDashboard {
    driverDashboard {
      availableJobs
      completedTrips
      rating
      earnings {
        thisMonth
        lastMonth
        currency
      }
      upcomingTrips {
        id
        title
        pickup
        delivery
        date
        status
      }
    }
  }
`;

// ─── CUSTOMER DASHBOARD ────────────────────────────────────────────────────────
export const GET_CUSTOMER_DASHBOARD = gql`
  query GetCustomerDashboard {
    customerDashboard {
      activeShipments
      totalShipments
      pendingQuotes
      recentShipments {
        id
        trackingNumber
        status
        pickup
        delivery
        estimatedDelivery
      }
    }
  }
`;

export const GET_MY_TENANT_MEMBERSHIPS = gql`
  query GetMyTenantMemberships {
    myTenantMemberships {
      id
      role
      tenant {
        id
        name
        slug
        logoUrl
      }
    }
  }
`;

export const GET_TENANT_THEME = gql`
  query GetTenantTheme($tenantId: String) {
    tenantTheme(tenantId: $tenantId) {
      primaryColor
      primaryColorDark
      secondaryColor
      accentColor
      backgroundColor
      backgroundDark
      textColor
      textColorDark
      borderRadius
    }
  }
`;
