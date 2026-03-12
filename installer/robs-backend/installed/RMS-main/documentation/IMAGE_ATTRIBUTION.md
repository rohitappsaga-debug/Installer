# Image Attribution and Licensing

## Overview
This document provides information about all images used in the Restaurant Management System project, their sources, and licensing information.

---

## Image Sources

### 1. Background Images (Unsplash)
All background images used in login pages are sourced from **Unsplash**, a platform providing free, high-quality stock photos.

#### Unsplash License
- **License Type**: Unsplash License (https://unsplash.com/license)
- **Usage Rights**: 
  - ✅ Free for commercial and non-commercial use
  - ✅ No permission required from photographer or Unsplash
  - ✅ No attribution required (but appreciated)
  - ✅ Can be modified, copied, and distributed
  - ✅ Can be used for any purpose

#### Images Used:

1. **Admin Login Background**
   - Source: `https://images.unsplash.com/photo-1552566626-52f8b828add9`
   - Description: Restaurant interior
   - License: Unsplash License (Free to use)

2. **Waiter/Mobile Login Background**
   - Source: `https://images.unsplash.com/photo-1414235077428-338989a2e8c0`
   - Description: Restaurant dining area
   - License: Unsplash License (Free to use)

3. **Kitchen Login Background**
   - Source: `https://images.unsplash.com/photo-1556910103-1c02745aae4d`
   - Description: Professional kitchen
   - License: Unsplash License (Free to use)

4. **Role Selection Background**
   - Source: `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4`
   - Description: Restaurant ambiance
   - License: Unsplash License (Free to use)

---

### 2. Screenshots
All screenshots in the `screenshots/` folder are original captures of the application interface:
- `admin-login.png`
- `waiter-login.png`
- `kitchen-login.png`
- `role-selection.png`
- `dashboard.png`
- `tables.png`
- `kitchen.png`
- `billing.png`

**License**: These are original works created for this project and are owned by the project creator.

---

### 3. SVG Placeholder Images
Custom-created SVG placeholders are used as fallback images when menu item images fail to load.

**Location**: `src/components/shared/ImageWithFallback.tsx`

**License**: Original work, part of this project.

---

### 4. Icons
All icons used in the project are from **Lucide React**.

**Package**: `lucide-react@0.487.0`

**License**: ISC License (https://github.com/lucide-icons/lucide/blob/main/LICENSE)

**Usage Rights**:
- ✅ Free for commercial and non-commercial use
- ✅ Can be modified, copied, and distributed
- ✅ No attribution required
- ✅ Open-source and permissive

**Icons Used Throughout the Application**:
- Navigation icons (Home, Bell, User, Settings, etc.)
- Action icons (Plus, Edit, Trash, Search, etc.)
- Status icons (CheckCircle, XCircle, AlertTriangle, etc.)
- UI icons (ChevronDown, ChevronRight, Moon, Sun, etc.)
- Feature-specific icons (UtensilsCrossed, ChefHat, ShoppingCart, etc.)

**Note**: FontAwesome and HeroIcons are **NOT** used in this project. Only Lucide React icons are used.

---

### 5. UI Component Libraries
The project uses **Radix UI** for accessible, unstyled UI components:

**Packages Used**:
- `@radix-ui/react-accordion`
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-avatar`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-label`
- `@radix-ui/react-popover`
- `@radix-ui/react-select`
- `@radix-ui/react-tabs`
- `@radix-ui/react-tooltip`
- And many more...

**License**: MIT License (https://github.com/radix-ui/primitives/blob/main/LICENSE)

**Usage Rights**:
- ✅ Free for commercial and non-commercial use
- ✅ Can be modified and distributed
- ✅ No attribution required

---

### 6. Fonts

**System Fonts Only** - No external web fonts are used.

The project uses **system font stack** (browser default fonts), which means:
- No Google Fonts
- No Adobe Fonts
- No external font files
- No font licensing concerns

**Font Stack**: The application relies on the user's operating system default fonts, typically:
- **Windows**: Segoe UI
- **macOS**: San Francisco
- **Linux**: Ubuntu, Roboto, or system default
- **Fallback**: Arial, Helvetica, sans-serif

**License**: N/A - System fonts are already installed on user devices and have no licensing restrictions for web use.

**Benefits**:
- ✅ Zero licensing concerns
- ✅ Faster page load (no font downloads)
- ✅ Native look and feel on each platform
- ✅ Better performance
- ✅ Accessibility (users' preferred fonts)

---

## Menu Item Images

Currently, menu items in the database do **not** have image URLs populated. When adding menu item images, ensure they are from one of the following sources:

### Recommended Free Stock Photo Sources:

1. **Unsplash** (https://unsplash.com/)
   - License: Unsplash License (Free, no attribution required)
   - Best for: High-quality food photography

2. **Pexels** (https://www.pexels.com/)
   - License: Pexels License (Free, no attribution required)
   - Best for: Food and restaurant images

3. **Pixabay** (https://pixabay.com/)
   - License: Pixabay License (Free, no attribution required)
   - Best for: Food illustrations and photos

4. **Foodiesfeed** (https://www.foodiesfeed.com/)
   - License: Free for commercial use
   - Best for: Food-specific photography

### Creating Your Own Images:
You can also use your own photographs of menu items. This is recommended for:
- Authenticity
- Accurate representation of your actual dishes
- Complete copyright ownership

---

## Copyright Compliance

### Summary:
✅ **All images currently used in this project are copyright-free and legally compliant.**

- **Unsplash images**: Free to use under Unsplash License
- **Screenshots**: Original works owned by project creator
- **SVG placeholders**: Original works created for this project
- **Icons**: Open-source libraries with permissive licenses (MIT)

### For Production Use:
When deploying this application for a real restaurant:

1. **Replace background images** with:
   - Your own restaurant photos (recommended)
   - Or continue using Unsplash images (perfectly legal)

2. **Add menu item images** from:
   - Your own food photography (recommended)
   - Free stock photo sites (Unsplash, Pexels, Foodiesfeed)
   - Purchased stock photos with commercial licenses

3. **Update branding**:
   - Add your restaurant logo
   - Customize color schemes
   - Update favicon

---

## Attribution (Optional but Appreciated)

While not required, you can optionally credit photographers:

### In Footer or About Page:
```
Background images courtesy of Unsplash (https://unsplash.com/)
Icons by Lucide (https://lucide.dev/)
```

---

## License Verification

All licenses were verified as of February 2026. For the most current license information:

- Unsplash License: https://unsplash.com/license
- Pexels License: https://www.pexels.com/license/
- Pixabay License: https://pixabay.com/service/license-summary/
- Lucide Icons: https://github.com/lucide-icons/lucide/blob/main/LICENSE
- Radix UI: https://github.com/radix-ui/primitives/blob/main/LICENSE

---

## Questions?

If you have questions about image licensing or need to add new images, refer to this document or consult the respective platform's license terms.

**Last Updated**: February 11, 2026
