// fallbackLibrary.js

module.exports = {
  "login to the website": [
    'Navigate to https://example.com/login',
    'Enter "user@example.com" into "#username"',
    'Enter "password123" into "#password"',
    'Click "#loginButton"',
  ],

  "search for a product": [
    'Enter "laptop" into "#searchInput"',
    'Click "#searchBtn"'
  ],

  "add item to cart": [
    'Click ".product-card:first-child .add-to-cart"'
  ],

  "verify user is logged in": [
    'Wait for "#logoutButton"',
    'Assert "#welcomeMessage" is visible'
  ],

  "upload resume": [
    'Upload "resume.pdf" into "input[type=\'file\']"'
  ]
};
