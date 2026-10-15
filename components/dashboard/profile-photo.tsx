"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 10 * 1024 * 1024;

type ProfilePhotoProps = {
  name: string;
  initialUrl: string | null;
};

export default function ProfilePhoto({
  name,
  initialUrl,
}: ProfilePhotoProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const photoUrl = preview ?? initialUrl;

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

async function handleUpload(
  event: ChangeEvent<HTMLInputElement>,
) {
  const file = event.target.files?.[0];
  event.target.value = "";

  if (!file || isUploading) return;

  setMessage("");

  if (
    !/\.jpe?g$/i.test(file.name) ||
    file.type !== "image/jpeg"
  ) {
    setMessage("Choose a JPG or JPEG image.");
    return;
  }

  if (file.size === 0 || file.size > MAX_BYTES) {
    setMessage("Choose an image up to 10 MB.");
    return;
  }

  setIsUploading(true);

  try {
    const signature = new Uint8Array(
      await file.slice(0, 3).arrayBuffer(),
    );

    if (
      signature[0] !== 0xff ||
      signature[1] !== 0xd8 ||
      signature[2] !== 0xff
    ) {
      setMessage("This file is not a valid JPEG image.");
      return;
    }

    setMessage("Checking your session…");

    const supabase = createClient();

    const { data, error: authError } =
      await supabase.auth.getUser();

    if (authError) {
      setMessage(`Session error: ${authError.message}`);
      return;
    }

    if (!data.user) {
      setMessage("Please sign in again before uploading.");
      return;
    }

    setMessage("Uploading your photo…");

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(`${data.user.id}/avatar.jpg`, file, {
        upsert: true,
        contentType: "image/jpeg",
        cacheControl: "0",
      });

    if (uploadError) {
      setMessage(`Upload failed: ${uploadError.message}`);
      return;
    }

    setFailedUrl(null);
    setPreview(URL.createObjectURL(file));
    setMessage("Profile photo updated.");

    router.refresh();
  } catch (error) {
    setMessage(
      error instanceof Error
        ? `Upload failed: ${error.message}`
        : "An unexpected upload error occurred.",
    );
  } finally {
    setIsUploading(false);
  }
}

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#e9efdf] text-3xl font-semibold text-[#173f35]">
        {photoUrl && photoUrl !== failedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={`${name}'s profile photo`}
            className="h-full w-full object-cover"
            onError={() => setFailedUrl(photoUrl)}
          />
        ) : (
          initials
        )}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,image/jpeg"
          aria-label="Choose profile photo"
          className="sr-only"
          disabled={isUploading}
          onChange={handleUpload}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 disabled:opacity-50"
        >
          {isUploading
            ? "Uploading…"
            : photoUrl
              ? "Change photo"
              : "Add your photo"}
        </button>

        <p className="mt-2 text-xs text-stone-500">
          JPG or JPEG · Up to 10 MB
        </p>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="w-full text-xs text-stone-600"
      >
        {message}
      </p>
    </div>
  );
}