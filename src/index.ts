import { SupabaseClient } from "@supabase/supabase-js";
import { isString } from "class-validator";

export class StorageError extends Error {
    constructor(objOrString: Partial<StorageError> | string) {
        if (isString(objOrString)) super(objOrString as string);
        else {
            super(objOrString.message);
            Object.assign(this, objOrString);
            Object.setPrototypeOf(this, StorageError.prototype);
        }
    }
}

export class CStorage {
    constructor(public supabaseClient: SupabaseClient) {}

    getBucketName(): string | undefined {
        return this.BUCKET_NAME;
    }

    async setBucketName(value: string) {
        this.BUCKET_NAME = value;
        await this.init();
    }

    async init() {
        this.BUCKET_URL_PREFIX = this.supabaseClient.storage
            .from(this.BUCKET_NAME!)
            .getPublicUrl("").data.publicUrl;
    }

    public getBucketURLPrefix(): string | undefined {
        return this.BUCKET_URL_PREFIX;
    }

    private BUCKET_URL_PREFIX?: string;
    private BUCKET_NAME?: string;

    /**
     * Initializes a bucket with the specified options.
     * If the bucket already exists, it will be updated with the specified options.
     * @param options - The options for the bucket initialization.
     * @returns A Promise that resolves when the bucket is successfully initialized.
     * @throws {StorageError} If the bucket name is not set or an error occurs during initialization.
     */
    async initBucket(
        options: {
            public: boolean;
            fileSizeLimit?: number | string | null;
            allowedMimeTypes?: string[] | null;
        } = {
            public: false,
        }
    ) {
        if (!this.BUCKET_NAME)
            throw new StorageError("Bucket name is not set");
        let { data, error } =
            await this.supabaseClient.storage.createBucket(
                this.BUCKET_NAME,
                options
            );
        if (error) {
            let { data, error } =
                await this.supabaseClient.storage.updateBucket(
                    this.BUCKET_NAME,
                    options
                );
            if (error) throw new StorageError(error);
        }
    }

    /**
     * Destroys the storage by emptying and deleting the bucket.
     * @throws {StorageError} If the bucket name is not set.
     */
    async destroyBucket() {
        if (!this.BUCKET_NAME)
            throw new StorageError("Bucket name is not set");
        await this.supabaseClient.storage.emptyBucket(
            this.BUCKET_NAME
        );
        await this.supabaseClient.storage.deleteBucket(
            this.BUCKET_NAME
        );
    }

    /**
     * Copies a file from the old path to the new path in the storage bucket.
     * If the bucket is public, oldPath and newPath can be public URLs.
     * @param oldPath The path of the file to be copied.
     * @param newPath The new path where the file will be copied to.
     * @returns A Promise that resolves to the public URL of the copied file.
     * @throws {StorageError} If the bucket name is not set or if there is an error during the copy operation.
     */
    async copy(oldPath: string, newPath: string): Promise<string> {
        if (!(oldPath[0] === "/" && newPath[0] === "/"))
            throw new StorageError("Path must start with /");

        oldPath = oldPath.slice(1);
        newPath = newPath.slice(1);
        if (!this.BUCKET_NAME)
            throw new StorageError("Bucket name is not set");

        const { data, error } = await this.supabaseClient.storage
            .from(this.BUCKET_NAME)
            .copy(oldPath, newPath);

        if (error || !data) throw new StorageError(error);

        return data.path.slice(this.BUCKET_NAME.length);
    }

    async delete(paths: string[]): Promise<string[]> {
        if (!this.BUCKET_NAME)
            throw new StorageError("Bucket name is not set");

        for (let path of paths) {
            if (path[0] !== "/")
                throw new StorageError("Path must start with /");
        }

        if (paths.length === 0) return [];
        let fileToDelete = (
            await Promise.all(
                paths.map((path) => this.listAllFiles(path))
            )
        ).flat();

        const { data, error } = await this.supabaseClient.storage
            .from(this.BUCKET_NAME)
            .remove(fileToDelete);

        if (error) throw new StorageError(error);
        if (!data) return [];
        let tmp: string[] = [];
        for (let file of data) {
            tmp.push("/" + file.name);
        }
        return tmp;
    }

    /**
     * Retrieves a list of all files in the specified path and its subdirectories.
     * @param path - The path to the directory.
     * @returns A promise that resolves to an array of strings representing the paths of all files.
     * @throws {StorageError} If the bucket name is not set or if there is an error retrieving the file list.
     */
    async listAllFiles(path: string): Promise<string[]> {
        if (!this.BUCKET_NAME)
            throw new StorageError("Bucket name is not set");

        if (path[0] === "/") path = path.slice(1);
        let { data: list, error } = await this.supabaseClient.storage
            .from(this.BUCKET_NAME)
            .list(path);
        if (error) throw new StorageError(error);
        if (!list) return [];
        if (list.length == 0) return [path];

        let files = list?.map((item) => `${path}/${item.name}`);
        if (!files) return [];

        let paths: string[] = [];
        for (let file of files) {
            let temp = await this.listAllFiles(file);
            paths = paths.concat(temp);
        }
        return paths;
    }

    async upload(
        file: Buffer | ArrayBuffer,
        uploadPath: string,
        mime: string = "text/plain;charset=UTF-8"
    ): Promise<string> {
        if (!file) throw new Error("File must have buffer property");
        if (!this.BUCKET_NAME)
            throw new StorageError("Bucket name is not set");

        const { data, error } = await this.supabaseClient.storage
            .from(this.BUCKET_NAME)
            .upload(uploadPath, file, {
                contentType: mime,
                upsert: true,
            });

        if (error || !data) throw new StorageError(error);
        return "/" + data.path;
    }
}
