import { SupabaseClient } from "@supabase/supabase-js";
import { ConvenientStorage } from ".";
import "dotenv/config";

const supabaseClient = new SupabaseClient(
    process.env.STORAGE_URL!,
    process.env.SERVICE_KEY!
);

let storage: ConvenientStorage = new ConvenientStorage(
    supabaseClient
);

async function main() {
    await storage.setBucketName("bucket0");
    await storage.initBucket();
    console.log(await storage.copy("test.txt", "test2.txt"));
}

main();
