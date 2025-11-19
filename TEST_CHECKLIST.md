# Pokemon Card Shop - Complete Testing Checklist

**Test Date**: 2025-11-19
**Site URL**: https://card-shop-ec-orpin.vercel.app
**Tester**: QA Team

---

## 1. 🏠 Homepage (/)

### Hero Section
- [ ] Carousel auto-advances every 5 seconds
- [ ] Previous/Next arrows work
- [ ] Pagination dots clickable
- [ ] "Shop Now" buttons navigate correctly
- [ ] "Browse All" button navigates to /products
- [ ] Images load properly

### Product Grid
- [ ] 12 products display correctly
- [ ] Product images visible (or placeholder shown)
- [ ] Card names in English
- [ ] Set names in English
- [ ] Prices display with ¥ symbol
- [ ] "Only X left" badge shows for stock ≤ 3
- [ ] SAR/UR badges display with correct colors
- [ ] Heart icon (wishlist) clickable
- [ ] "Add" button clickable

### Filter Sidebar
- [ ] Price range slider functional
- [ ] Price values update dynamically
- [ ] Card set checkboxes clickable
- [ ] Rarity buttons clickable
- [ ] Condition checkboxes clickable
- [ ] Other filters checkable
- [ ] "Clear" button works
- [ ] "Apply Filters" button functional

### Sort Dropdown
- [ ] Dropdown opens
- [ ] "Newest" option selects
- [ ] "Price: Low to High" option selects
- [ ] "Price: High to Low" option selects
- [ ] "Most Popular" option selects

### Pagination
- [ ] "Previous" button disabled on page 1
- [ ] Page number buttons clickable
- [ ] "Next" button works
- [ ] Current page highlighted

---

## 2. 🔍 Header Navigation

### Logo & Branding
- [ ] Logo visible
- [ ] "CardShop" text displays
- [ ] Clicking logo returns to homepage

### Main Menu
- [ ] "Pokemon Cards" dropdown appears on hover
- [ ] Subcategories visible:
  - [ ] Booster Packs
  - [ ] Single Cards
  - [ ] Graded Cards
  - [ ] Promo Cards
- [ ] Each submenu link navigates correctly

### Search Bar (Desktop)
- [ ] Search input accepts text
- [ ] Search icon visible
- [ ] Enter key submits search
- [ ] Navigates to /search?q={query}

### Mobile Search
- [ ] Search icon toggles search bar
- [ ] Mobile search bar appears
- [ ] Search functional on mobile

### Language Switcher
- [ ] Globe icon 🌐 visible
- [ ] Dropdown opens on click
- [ ] English option selectable
- [ ] Japanese option selectable
- [ ] Flag icons display correctly
- [ ] Selected language highlighted

### Action Icons
- [ ] Wishlist icon visible
- [ ] Wishlist counter shows correct number
- [ ] User icon clickable
- [ ] Cart icon visible
- [ ] Cart counter shows correct number
- [ ] Cart link navigates to /cart

### Mobile Menu
- [ ] Hamburger icon visible on mobile
- [ ] Menu opens/closes
- [ ] All categories visible in mobile menu
- [ ] Links work in mobile menu

---

## 3. 🛒 Cart Functionality (/cart)

### Add to Cart
- [ ] "Add" button on product card works
- [ ] Cart counter increments
- [ ] Visual feedback when item added
- [ ] Duplicate items increment quantity

### Cart Page
- [ ] Navigate to /cart
- [ ] All cart items display
- [ ] Product name, image, price visible
- [ ] Quantity selector works (+/-)
- [ ] Remove item button works
- [ ] Subtotal calculates correctly
- [ ] Tax calculates (if applicable)
- [ ] Total amount correct
- [ ] "Checkout" button visible
- [ ] "Continue Shopping" link works
- [ ] Empty cart message if no items

---

## 4. ❤️ Wishlist Functionality (/wishlist)

### Add to Wishlist
- [ ] Heart icon clickable on product
- [ ] Wishlist counter increments
- [ ] Visual feedback (icon fills/changes color)

### Wishlist Page
- [ ] Navigate to /wishlist
- [ ] All wishlist items display
- [ ] Product cards show correctly
- [ ] "Move to Cart" button works
- [ ] "Remove" button works
- [ ] Empty wishlist message if no items

---

## 5. 🔐 Authentication

### Sign Up (/auth/signup)
- [ ] Navigate to signup page
- [ ] Email field accepts input
- [ ] Password field accepts input
- [ ] Password visibility toggle works
- [ ] "Sign Up" button functional
- [ ] Validation errors display
- [ ] Success redirects to homepage/dashboard

### Sign In (/auth/signin)
- [ ] Navigate to signin page
- [ ] Email field accepts input
- [ ] Password field accepts input
- [ ] "Sign In" button functional
- [ ] Google sign-in button visible
- [ ] "Forgot Password" link (if exists)
- [ ] Redirect after login works

### Sign Out
- [ ] Sign out button visible when logged in
- [ ] Sign out successful
- [ ] Redirect after logout

---

## 6. 📦 Product Pages

### Product List (/products)
- [ ] Page loads all products
- [ ] Grid layout responsive
- [ ] Filters work
- [ ] Sort options work
- [ ] Pagination works

### Product Detail (/products/[id])
- [ ] Click product card navigates to detail
- [ ] Product name displays
- [ ] Product image displays
- [ ] Price displays
- [ ] Stock status shows
- [ ] Rarity badge visible
- [ ] Condition visible
- [ ] Card set name
- [ ] Card number
- [ ] "Add to Cart" button works
- [ ] "Add to Wishlist" button works
- [ ] Quantity selector works
- [ ] Related products section (if exists)

---

## 7. 🔍 Search Functionality (/search)

### Search Page
- [ ] Navigate via search bar
- [ ] Query parameter works (?q=)
- [ ] Search results display
- [ ] "No results" message if empty
- [ ] Product cards clickable
- [ ] Filters work on search results
- [ ] Sort works on search results

---

## 8. 💳 Checkout Process (/checkout)

### Checkout Page
- [ ] Navigate from cart to checkout
- [ ] Cart items summary displays
- [ ] Shipping address form:
  - [ ] All fields accept input
  - [ ] Required fields validated
  - [ ] Country selector works
- [ ] Billing address option
- [ ] Payment method selection
- [ ] Order summary shows correct totals
- [ ] "Place Order" button functional
- [ ] Loading state during processing

### Checkout Success (/checkout/success)
- [ ] Success page displays after order
- [ ] Order number shows
- [ ] Order details visible
- [ ] "Continue Shopping" link works

---

## 9. 🔧 Admin Pages

### Admin Dashboard (/admin)
- [ ] Navigate to /admin
- [ ] Requires authentication
- [ ] Statistics display:
  - [ ] Total Products
  - [ ] In Stock
  - [ ] Low Stock
  - [ ] Out of Stock
- [ ] Recent orders visible (if implemented)
- [ ] Quick actions work

### Product Management (/admin/products)
- [ ] Product list displays
- [ ] Search products works
- [ ] Filter button functional
- [ ] "CSV Import" button navigates to import page
- [ ] "Export" button works
- [ ] "Add Product" navigates to new product page
- [ ] Edit icons work
- [ ] Delete icons work (with confirmation)
- [ ] Product stats accurate

### Add Product (/admin/products/new)
- [ ] All form fields visible
- [ ] Card name input accepts text
- [ ] Pack name dropdown populated
- [ ] Card number input works
- [ ] Rarity dropdown works
- [ ] Condition dropdown works
- [ ] Graded checkbox toggles fields
- [ ] Grading company dropdown (if graded)
- [ ] Grade input (if graded)
- [ ] Foil checkbox works
- [ ] First edition checkbox works
- [ ] Language selector works
- [ ] Price input accepts numbers
- [ ] Stock input accepts numbers
- [ ] Description textarea works
- [ ] "Cancel" button works
- [ ] "Save" button submits form
- [ ] Validation errors display
- [ ] Success redirects to product list

### CSV Import (/admin/products/import)
- [ ] Navigate to import page
- [ ] "Download Template" button works
- [ ] CSV template downloads correctly
- [ ] File upload area accepts files
- [ ] Drag & drop works
- [ ] Selected file name displays
- [ ] "Import" button processes file
- [ ] Success/failure message displays
- [ ] Error details show if failures
- [ ] "Back to Products" link works

---

## 10. 📱 Responsive Design

### Mobile (< 768px)
- [ ] Homepage displays correctly
- [ ] Navigation hamburger works
- [ ] Product grid stacks vertically
- [ ] Filters accessible
- [ ] Cart accessible
- [ ] Forms usable
- [ ] All buttons tapable (44x44px min)

### Tablet (768px - 1024px)
- [ ] Layout adjusts appropriately
- [ ] Product grid 2-3 columns
- [ ] Navigation accessible
- [ ] All features functional

### Desktop (> 1024px)
- [ ] Full layout displays
- [ ] Product grid 4 columns
- [ ] Sidebar filters visible
- [ ] All features functional

---

## 11. 🌐 Internationalization

### Language Switching
- [ ] Click globe icon
- [ ] Select English - content updates
- [ ] Select Japanese - content updates
- [ ] Language persists across pages
- [ ] Product names translate
- [ ] UI elements translate
- [ ] Currency format correct per locale

---

## 12. ⚡ Performance

### Load Times
- [ ] Homepage loads < 3 seconds
- [ ] Product pages load < 2 seconds
- [ ] Images lazy load
- [ ] No console errors
- [ ] No broken images

### Functionality
- [ ] Smooth scrolling
- [ ] Transitions work
- [ ] No layout shifts
- [ ] Forms respond quickly
- [ ] Buttons have hover states

---

## 13. 🔒 Security & Data

### Authentication
- [ ] Protected routes redirect to login
- [ ] Admin pages require admin role
- [ ] Session persists on refresh
- [ ] Logout clears session

### Data Validation
- [ ] Email format validated
- [ ] Password requirements enforced
- [ ] Price inputs accept only numbers
- [ ] Stock inputs accept only integers
- [ ] XSS protection (no script injection)

---

## 14. 🐛 Known Issues to Check

### Cart System
- [ ] **CRITICAL**: Add to cart actually adds item
- [ ] Cart persists across page navigation
- [ ] Cart syncs with backend (if implemented)
- [ ] Quantity updates persist

### Database Integration
- [ ] Products load from Supabase (not just mock data)
- [ ] User data saves to database
- [ ] Orders save to database
- [ ] Product inventory updates on purchase

### API Routes
- [ ] /api/auth/[...nextauth] - Authentication works
- [ ] /api/admin/products - CRUD operations work
- [ ] /api/admin/products/import - CSV import works
- [ ] Error responses return proper status codes

---

## 15. ✅ Final Checklist

### Pre-Production
- [ ] All environment variables set in Vercel
- [ ] Database connected and accessible
- [ ] Prisma schema pushed to database
- [ ] Test data in database (or seeded)
- [ ] Google OAuth configured (if used)

### Post-Deployment
- [ ] Deployment successful
- [ ] No build errors
- [ ] Site accessible at production URL
- [ ] SSL certificate valid
- [ ] No mixed content warnings

### Documentation
- [ ] README updated
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] API documentation (if applicable)

---

## 📝 Bug Tracking Template

**Bug ID**: 
**Severity**: Critical / High / Medium / Low
**Component**: Header / Cart / Checkout / Admin / etc.
**Description**: 
**Steps to Reproduce**:
1. 
2. 
3. 
**Expected Result**: 
**Actual Result**: 
**Screenshot/Video**: 
**Browser/Device**: 
**Fix Priority**: 

---

## Test Results Summary

**Total Tests**: ___ / 250+
**Passed**: ___
**Failed**: ___
**Blocked**: ___
**Not Tested**: ___

**Critical Issues Found**: ___
**High Priority Issues**: ___
**Medium Priority Issues**: ___
**Low Priority Issues**: ___

**Tester Signature**: _________________
**Date Completed**: _________________
