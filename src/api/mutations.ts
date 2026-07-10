import { gql } from '@apollo/client';

// ─── AUTH MUTATIONS ────────────────────────────────────────────────────────────
export const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    register(input: $input) {
      success
      message
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($input: LoginInput!) {
    login(input: $input) {
      ... on AuthTokensType {
        accessToken
        refreshToken
        user {
          id
          email
          firstName
          lastName
          role
          tenantId
          profilePhotoUrl
        }
      }
      ... on LoginError {
        code
        message
      }
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

export const LOGOUT_USER = gql`
  mutation LogoutUser {
    logout {
      success
    }
  }
`;

// ─── PASSWORD RESET ────────────────────────────────────────────────────────────
export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input) {
      success
      message
    }
  }
`;

export const VERIFY_OTP = gql`
  mutation VerifyOtp($email: String!, $otp: String!) {
    verifyOtp(email: $email, otp: $otp) {
      success
      message
      resetToken
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      success
      message
    }
  }
`;

// ─── JOB APPLICATION ──────────────────────────────────────────────────────────
export const APPLY_FOR_JOB = gql`
  mutation ApplyForJob($input: JobApplicationInput!) {
    applyForJob(input: $input) {
      success
      message
      application {
        id
        status
        appliedAt
      }
    }
  }
`;

// ─── NEWSLETTER ────────────────────────────────────────────────────────────────
export const SUBSCRIBE_NEWSLETTER = gql`
  mutation SubscribeNewsletter($email: String!) {
    subscribeNewsletter(email: $email) {
      success
      message
    }
  }
`;

// ─── CUSTOMER DASHBOARD MUTATIONS ──────────────────────────────────────────────
export const REQUEST_QUOTE = gql`
  mutation RequestQuote($input: RequestQuoteInput!) {
    requestQuote(input: $input) {
      success
      message
      quote {
        id
        pickupLocation
        deliveryLocation
        pickupLat
        pickupLng
        deliveryLat
        deliveryLng
        weightTons
        containerType
        cargoDetails
        estimatedPrice
        status
        createdAt
      }
    }
  }
`;

export const BOOK_QUOTE = gql`
  mutation BookQuote($quoteId: String!) {
    bookQuote(quoteId: $quoteId) {
      success
      message
      quote {
        id
        status
      }
    }
  }
`;

export const PROCESS_PAYMENT = gql`
  mutation ProcessPayment($input: ProcessPaymentInput!) {
    processPayment(input: $input) {
      id
      transactionId
      paymentMethod
      amount
      timestamp
    }
  }
`;

export const UPDATE_DRIVER_PROFILE = gql`
  mutation UpdateDriverProfile($input: UpdateDriverProfileInput!) {
    updateDriverProfile(input: $input) {
      id
      licenseNumber
      licenseClass
      experienceYears
      status
      rating
    }
  }
`;

export const LOG_LOCATION = gql`
  mutation LogLocation($input: LocationLogInput!) {
    logLocation(input: $input) {
      id
      latitude
      longitude
      speedKph
      heading
      timestamp
    }
  }
`;

export const CREATE_TRUCK = gql`
  mutation CreateTruck($input: CreateTruckInput!) {
    createTruck(input: $input) {
      id
      plateNumber
      make
      model
      capacityTons
      status
    }
  }
`;

export const CREATE_CONTAINER = gql`
  mutation CreateContainer($input: CreateContainerInput!) {
    createContainer(input: $input) {
      id
      containerNumber
      containerType
      status
    }
  }
`;

export const UPDATE_TENANT_THEME = gql`
  mutation UpdateTenantTheme($input: UpdateTenantThemeInput!) {
    updateTenantTheme(input: $input) {
      primaryColor
      primaryColorDark
      borderRadius
    }
  }
`;

export const UPDATE_PRICING_MATRIX = gql`
  mutation UpdatePricingMatrix(
    $containerType: String!
    $baseRate: Float!
    $perTonRate: Float!
    $perKmRate: Float!
    $sourceLocation: String
    $destinationLocation: String
  ) {
    updatePricingMatrix(
      containerType: $containerType
      baseRate: $baseRate
      perTonRate: $perTonRate
      perKmRate: $perKmRate
      sourceLocation: $sourceLocation
      destinationLocation: $destinationLocation
    )
  }
`;

export const CREATE_SUPPORT_TICKET = gql`
  mutation CreateSupportTicket($subject: String!, $description: String!, $category: String!, $priority: String!) {
    createSupportTicket(subject: $subject, description: $description, category: $category, priority: $priority) {
      id
      subject
      description
      status
      priority
      category
      createdAt
    }
  }
`;

export const CREATE_SUPPORT_TICKET_RESPONSE = gql`
  mutation CreateSupportTicketResponse($ticketId: String!, $message: String!) {
    createSupportTicketResponse(ticketId: $ticketId, message: $message) {
      id
      message
      isStaff
      createdAt
    }
  }
`;
