import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
    // Route for uploading video files
    videoUploader: f({
        video: { maxFileSize: "2GB", maxFileCount: 1 },
    })
        .middleware(async () => {
            const session = await auth();
            if (!session) throw new Error("Unauthorized");
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // Return the file URL — it's saved to DB in the form submit handler
            return { uploadedBy: metadata.userId, url: file.ufsUrl };
        }),

    // Route for uploading thumbnail images
    thumbnailUploader: f({
        image: { maxFileSize: "8MB", maxFileCount: 1 },
    })
        .middleware(async () => {
            const session = await auth();
            if (!session) throw new Error("Unauthorized");
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ file }) => {
            return { url: file.ufsUrl };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
