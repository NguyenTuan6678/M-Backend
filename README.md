# 📄 M-Invoice Backend API

Backend API for an M-Invoice (Electronic Invoice) system built with NestJS and MongoDB, designed to manage sales transactions, agencies, products, and financial data.

## 🚀 Tech Stack

**Framework:** NestJS

**Database:** MongoDB (Mongoose)

**Language:** TypeScript

**Build Tool:** SWC (for fast compilation)

## 📌 Features

- 🧾 Manage Sales Transactions (Invoices)
- 📦 Product Management (price, tax rate, accounting code)
- 🏢 Agency Management (commission calculation)
- 👨‍💼 Employee & Department Management
- 🏦 Bank Management
- 💰 Payment Tracking (paid/unpaid, payment date, bank)
- 📊 Scalable structure for reporting (revenue, commission, etc.)
- 🗄️ Data Model Overview

## ⚙️ Installation

Install my-project with npm

```bash
# clone project

git clone

# install dependencies

npm install

# run development

npm run start:dev
```

## Documentation

```bash
# swagger docs

localhost:4000/api/docs
```

🔒 Validation & Transformation

- Uses class-validator for request validation
- Uses class-transformer for response shaping
- Sensitive fields (e.g. passwords) are excluded using @Exclude()

**🧩 Future Improvements**

- 📊 Reporting dashboard (revenue, commission)
- 🔐 Authentication & Authorization (JWT, Roles)
- 📁 File export (PDF invoices, Excel reports)
- 🔄 Integration with external CRM systems

**📌 Notes**

MongoDB collections are created automatically via Mongoose schemas
Monetary values should be calculated on backend (avoid trusting frontend)
Use DTOs for all input validation

## Authors

- [@HarryNguyen](https://github.com/NguyenTuan6678)

## License

[MIT](https://choosealicense.com/licenses/mit/)
