const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config();

const serviceAccount = {
  "type": "service_account",
  "project_id": "onlinejudge-d74b4",
  "private_key_id": "29e20b89eec7099dce7d1a06c09c1fe348c842d4",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCWSJE28LY1yppx\nw4bNPho1/ALtnzN6V1lKyz2izIAQgAIq0ZMOgVf1EcWYVznVHy1ZaNjYgkpJDnmn\nzIq22Lf5KBb+0ZUWArTfZMDhJe+yv7fIoO3mx1yvSl2KK6oAP0aSMve2oFAxLAth\nddEE4DGZY+zT6yhAU7zf7nLmg6emXUuzbKeH26FUsi6zNGq7GW5vDgr+5pj7VkN9\na6vKQIr7Tf/1Pnm5s5Q+e7f82+h0PDQHKHFDz4AiO38RvueGRuHcDpmmvjAmWgZG\nk8mTGAQYCBkqiMAsy1wHp/0X9GfEVS1/y//93s7bTz/ZxyLBtvOZFG0XKAv3o2Dz\nNRttx++VAgMBAAECggEAAxg0cUqsndfxrTUHAhPsyz7IuqbkEvlYe9tKhh8q5ewU\n31fYbNyJ+KBojrYBGVvefbBUgsTQDcgQBj4GfzRgOW+zZYTgSoc8vTrgY+J5mJct\nDCMQMwfY5z0jRvSWOBIVfG4zPp33eMO86kFYT/7j1pJBrq1xcz2mLoBE+m0slxbd\nonGVABe/7fFacfpVtoO8PYqMv3F5hREokraUat0eYQYJbJrRFZVP61AW6DlQWW6r\nroqoe49LPvhvgu8QOYV0K1tLe7Rs0ghlsLL7b/YnUz0pS/Y9fMeyJOsRF/+HQccu\nGbm+F35FX2F1DLBj/gMScCq3eDwRwfFtNZ3SIBdBIwKBgQDLO/VlgCW8AZQjex7i\nuslmlKndqonCQr3H3gAQCHE3lsy+89dIpNNKfCrlg/42x3tzimvtZfII5wSJzqgP\n1AiBmeLG20ApNytPheU+ReUKTK6QVbc2N8+mDpHOJJ56TcPOUyrlECZaIWKF6G0r\n20xYcFhqFPjortJFJywmbsOL8wKBgQC9TTdvPYmxBp1ai7BKSFBEUJ04zsWPYtFF\nfN2wKRg4JMgd4ldpKCZ6A5IhzVXa40mxjjgZl+iBVIFS51rqLQpcsK2byDCf72z8\n7F/7hQxpjEbv6OtxSsmk+SQ4Czb1Rw9bBNJ2OW/TjCT8T1vsAsOt/Ss+rapZcP+O\nXhkhZxcgVwKBgFENa5P8ZJAzbPotiybPaa0gkxJVhjVUWs3QKuQ6CbUqziNFqlFN\ncvrcxFrepk8AhaqRxPNb2ghU4gl3wqz1WiMd1USLgm4tk3dWphOM2oieBmyH0tar\nsYO/gcTd89pBE1tA7fWG2FTPxbQz+v4nqq4GuCwuiwp5VmC/+6qkOBajAoGBAKFe\nwKHAaK8Sv3KfX7GDAYGq4su5YCpCB7lfny97aJz7pefrua33vw0GHD1aaBTG6lxE\nq0gN+fK90dyVQigcKxgmuGfy+JhuJo9ZBN1JZvJW1WXQPVx/b3OFur1XugrO/6UM\ncEi937kLX8AB+o8vMBYSmhm9O1kxfXikeHHECq/TAoGBAJN7N1cPIWqMyBNs/ZPL\n5c3uRXZPuqEFzjuNEL/vVmdu/o5/hH0mXALFfLT11Ru9td2rXkWebOf553wRh7zf\nUvD/AwWXISBF/5Mc5KLu8Hu968o7HfyAYtN59OqVqlAZ7qQjN3Z8W3b6xm/TFKC7\nJqDzlHeQ49RfTVOoXlGqKMqL\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-4ltiw@onlinejudge-d74b4.iam.gserviceaccount.com",
  "client_id": "103479758735587185852",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-4ltiw%40onlinejudge-d74b4.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();

// Initialize MongoDB Client
const uri = process.env.MONGO_URL;
const client = new MongoClient(uri);

async function syncGoogleUsersToMongoDB(users) {
  try {
    await client.connect();
    const database = client.db('test');
    const collection = database.collection('googleusers');

    const bulkOps = users.map(user => {
      return {
        updateOne: {
          filter: { uid: user.uid },
          update: { $set: user },
          upsert: true,
        },
      };
    });

    await collection.bulkWrite(bulkOps);
  } finally {
    await client.close();
  }
}

async function listUsers(nextPageToken) {
  try {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    const googleUsers = listUsersResult.users.filter(user => {
      return user.providerData.some(provider => provider.providerId === 'google.com');
    });

    if (googleUsers.length > 0) {
      await syncGoogleUsersToMongoDB(googleUsers.map(user => user.toJSON()));
    }

    if (listUsersResult.pageToken) {
      await listUsers(listUsersResult.pageToken);
    }
  } catch (error) {
    console.error('Error listing users:', error);
  }
}

module.exports = { listUsers };
