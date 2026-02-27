import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// This handles all UploadThing uploads at /api/uploadthing
export const { GET, POST } = createRouteHandler({ router: ourFileRouter });
