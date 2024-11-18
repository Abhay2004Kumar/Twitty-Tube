# Twitty-Tube: Backend Project

A backend system that combines the features of YouTube and Twitter to enable seamless video uploads, tweets, and interactive user engagement through likes and comments.

---

## **Features**

### **1. User Authentication**
- Implements secure JWT-based authentication for user login.
- Supports email verification to ensure account authenticity.

### **2. Video and Tweet Management**
- Facilitates the uploading and management of videos and text-based tweets.

### **3. Commenting System**
- Enables users to add, update, delete, and fetch comments on tweets and videos.

### **4. Like System**
- Tracks and manages likes on tweets and videos.
- Enables users to like/unlike content seamlessly.

### **5. RESTful APIs**
- Provides robust APIs for:
  - CRUD operations on tweets and videos.
  - Managing likes and comments.
  - Fetching user profiles.

### **6. Media File Handling**
- Supports uploads of various media types, including:
  - Images
  - Videos
  - Other file attachments
- Integrates with **Cloudinary** for efficient media storage and delivery.

### **7. Database Management**
- Uses MongoDB to store:
  - User profiles
  - Tweets and videos
  - Comments and likes

### **8. Security & Error Handling**
- Incorporates input validation and secure endpoint practices.
- Implements comprehensive error handling for uninterrupted operation.

---

## **Technology Stack**

- **Node.js**: Backend runtime environment.
- **Express.js**: Framework for building RESTful APIs.
- **MongoDB**: NoSQL database for scalable data storage.
- **Cloudinary**: Cloud-based media management platform.

---

## **Installation and Setup**

```bash
# Clone the Repository
git clone https://github.com/Abhay2004Kumar/Twitty-Tube.git
cd twittytube

# Install Dependencies
npm install

# Configure Environment Variables
# Create a `.env` file in the root directory and add the following:

MONGODB_URI=
PORT=
CORS_ORIGIN=*

# Authentication Settings
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=

# Cloudinary Settings
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_SECRET_KEY=

# Run the project
npm run dev


