#!/bin/sh
set -e

# Script used during deployment on Appwrite Sites

# Replace [appwriteEndpoint] with APPWRITE_ENDPOINT in environments files
sed -i "s|\[appwriteEndpoint\]|$APPWRITE_ENDPOINT|g" src/environments/*.ts

# Replace [appwriteProjectId] with APPWRITE_PROJECT_ID in environments files
sed -i "s|\[appwriteProjectId\]|$APPWRITE_PROJECT_ID|g" src/environments/*.ts

# Replace [appwriteProjectName] with APPWRITE_PROJECT_NAME in environments files
sed -i "s|\[appwriteProjectName\]|$APPWRITE_PROJECT_NAME|g" src/environments/*.ts
