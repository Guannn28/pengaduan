const path = require("path");
const { v2: cloudinary } = require("cloudinary");
const env = require("../config/env");
const { generateFilenameToken } = require("./security");

const cloudinaryFolders = Object.freeze({
  complaintEvidence: "pengaduan/bukti",
  studentCards: "pengaduan/kartu-pelajar",
});

let isConfigured = false;

const configureCloudinary = () => {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Konfigurasi Cloudinary belum lengkap. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET."
    );
  }

  if (!isConfigured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    isConfigured = true;
  }

  return cloudinary;
};

const getSafePublicIdPart = (originalName) => {
  const parsed = path.parse(String(originalName || "file"));
  const safeName = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeName || "file";
};

const uploadBufferToCloudinary = (file, folder) => {
  if (!file?.buffer) {
    return Promise.reject(new Error("File upload tidak valid."));
  }

  const client = configureCloudinary();
  const publicId = `${Date.now()}-${generateFilenameToken()}-${getSafePublicIdPart(file.originalname)}`;

  return new Promise((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "auto",
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url) {
          reject(new Error("Cloudinary tidak mengembalikan URL file."));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      }
    );

    uploadStream.on("error", reject);
    uploadStream.end(file.buffer);
  });
};

const deleteCloudinaryAsset = async (publicId, resourceType = "image") => {
  if (!publicId) {
    return null;
  }

  const client = configureCloudinary();
  return client.uploader.destroy(publicId, {
    resource_type: resourceType || "image",
    invalidate: true,
  });
};

module.exports = {
  deleteCloudinaryAsset,
  cloudinaryFolders,
  uploadBufferToCloudinary,
};
