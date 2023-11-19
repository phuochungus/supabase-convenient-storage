import { SupabaseClient } from "@supabase/supabase-js";
import { CStorage } from "./index";
import { readFileSync } from "fs";
import { isURL } from "class-validator";

const supabaseClient = new SupabaseClient(
    process.env.STORAGE_URL!,
    process.env.SERVICE_KEY!
);

let storage: CStorage = new CStorage(supabaseClient);

test("init correctly", async () => {
    expect(supabaseClient).toBeDefined();
    expect(storage).toBeDefined();
});

test("throw error if bucket name is undefine", async () => {
    await expect(storage.destroyBucket()).rejects.toThrow(
        "Bucket name is not set"
    );
});

test("return undefine if bucket name is undefine", async () => {
    expect(storage.getBucketName()).toBeUndefined();
});

test("throw error if bucket name is undefine", async () => {
    await expect(storage.initBucket()).rejects.toThrow();
});

test("set bucket name correctly", async () => {
    await expect(
        storage.setBucketName("bucket0")
    ).resolves.not.toThrow();
});

test("return bucket name correctly", async () => {
    expect(storage.getBucketName()).toBe("bucket0");
});

test("init bucket correctly", async () => {
    await expect(storage.initBucket()).resolves.not.toThrow();
});

test("destroy bucket correctly", async () => {
    await expect(storage.destroyBucket()).resolves.not.toThrow();
});

test("init bucket correctly", async () => {
    await expect(
        storage.initBucket({ public: true })
    ).resolves.not.toThrow();
});

test("bucket url prefix is correct", async () => {
    expect(isURL(storage.getBucketURLPrefix()!)).toBe(true);
});

test("upload file correctly", async () => {
    const buffer = readFileSync("./src/test.txt");
    await expect(
        storage.upload(buffer, "/test.txt", "text/plain")
    ).resolves.toBe("/test.txt");
});

test("copy file correctly", async () => {
    await expect(
        storage.copy("/test.txt", "/dir/test2.txt")
    ).resolves.toBe("/dir/test2.txt");
});

test("list file correctly", async () => {
    await expect(storage.listAllFiles("/dir")).resolves.toEqual([
        "dir/test2.txt",
    ]);
});

test("delete dir and file inside correctly", async () => {
    await expect(storage.delete(["/dir"])).resolves.toEqual([
        "/dir/test2.txt",
    ]);
    await expect(storage.delete(["/test.txt"])).resolves.toEqual([
        "/test.txt",
    ]);
});
