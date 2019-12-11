import fromUrlStatus from "../src/api/fromUrlStatus";

// 'https://images.unsplash.com/photo-1575956357346-61464dcf5c00?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2734&q=80'
// '1ce65d80-0c63-4f5a-a210-6edd0391a62b'
fromUrlStatus('')
  .then(console.log)
  .catch(console.log);
