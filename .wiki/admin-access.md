# Admin Access Guide

This guide provides the necessary credentials and instructions to access the DreamBeesArt Admin Panel.

## Credentials

The following admin user has been created in the Firestore database:

| Detail | Value |
|---|---|
| **Email** | `admin@dreambees.art` |
| **Password** | `admin-password-123` |
| **Display Name** | Head Merchant |
| **Role** | `admin` |

> [!WARNING]
> These credentials are for local development use only. Ensure you rotate passwords and use secure environment variables in a production environment.

## How to Access

1.  **Start the Application**: Ensure the development server is running.
    ```bash
    npm run dev
    ```
2.  **Navigate to Login**: Open your browser and go to `http://localhost:3000/login`.
3.  **Sign In**: Enter the admin credentials provided above.
4.  **Redirect to Admin**: Once authenticated, you can navigate to the Admin Panel at `http://localhost:3000/admin`.
    - If you are already logged in as an admin, visiting `/admin` will take you directly to the dashboard.
    - If you are logged in as a regular customer, you will be denied access to `/admin` routes.

## Admin Features Available

Once logged in, you will have access to:
- **Dashboard**: [Overview of store performance](http://localhost:3000/admin)
- **Orders**: [Fulfillment and status management](http://localhost:3000/admin/orders)
- **Inventory**: [Stock health and restock tools](http://localhost:3000/admin/inventory)
- **Products**: [Catalog management and bulk editing](http://localhost:3000/admin/products)
- **Customers**: [Customer insights and LTV tracking](http://localhost:3000/admin/customers)
- **Analytics**: [Deep-dive sales reports](http://localhost:3000/admin/analytics)
- **Discounts**: [Promotion and coupon management](http://localhost:3000/admin/discounts)

## Technical Verification

To verify the admin role in the database manually, you can check the Firestore `users` collection or use the Firebase CLI (if configured):
```bash
# Example check via Firebase console or Admin SDK script
```
