import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

/**
 * Drop target for resumes. Files already in the list (by name) are skipped so
 * dropping the same folder twice does not queue duplicates.
 */
export default function usePdfDropzone(setFiles, { disabled } = {}) {
  const onDrop = useCallback(
    (accepted) => {
      setFiles((prev) => {
        const seen = new Set(prev.map((file) => file.name));
        return [...prev, ...accepted.filter((file) => !seen.has(file.name))];
      });
    },
    [setFiles],
  );

  return useDropzone({
    onDrop,
    disabled,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_PDF_BYTES,
    noClick: true,
    noKeyboard: true,
    onDropRejected: (rejections) =>
      toast.error(
        `${rejections.length} file${rejections.length === 1 ? "" : "s"} rejected. Only PDFs up to 10 MB are accepted.`,
      ),
  });
}
