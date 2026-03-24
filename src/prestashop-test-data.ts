export const PRESTASHOP_TEST_DATA = {
  customer: {
    email: '',
    password: '',
    resetEmail: ''
  },
  guest: {
    email: 'guest.checkout@example.com',
    firstName: 'Demo',
    lastName: 'Guest',
    address: '123 Testing Street',
    city: 'Paris',
    postcode: '75001',
    country: 'France',
    phone: '0123456789'
  },
  admin: {
    wrongEmail: 'wrong-admin@example.com',
    wrongPassword: 'WrongPassword123!',
    trackingNumber: 'TRACK-PS-12345'
  },
  catalog: {
    loginProduct: 'Hummingbird printed t-shirt',
    searchProduct: 'mug',
    partialSearch: 'hum',
    noResultsSearch: 'xyzqwerty123',
    autocompleteSearch: 'dress',
    sortByPriceSearch: 'art',
    sortByNameSearch: 'accessories',
    categoryName: 'Clothes',
    alternateCategoryName: 'Accessories',
    colorFilter: 'White'
  },
  checkout: {
    promoCode: ''
  },
  orders: {
    reference: ''
  },
  features: {
    enableCustomerAccountScenarios: false,
    enableCheckoutOrderPlacement: false,
    enableAdminMutations: false
  }
} as const;

