import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  IconButton,
  Paper,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import { useRoute } from "wouter";
import { api } from "@/lib/api";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";
import { useAuth } from "@/contexts/AuthContext";
import { MenuItem } from "@mui/material";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Check from "@mui/icons-material/Check";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import CollectionsOutlined from "@mui/icons-material/CollectionsOutlined";
import History from "@mui/icons-material/History";
import {
  ChatMessage,
  ChatRegenerateRequest,
  IterationItem,
  PropertyDetails,
} from "@/types";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FinalSelectionModal from "@/components/FinalSelectionModal";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Tooltip from "@mui/material/Tooltip";
import ConfirmModal from "@/components/ConfirmModal";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import AppNavbar from "@/components/AppNavBar";

/* ================= DESIGN TOKENS ================= */
const ui = {
  bg: "#F6F7F9",
  white: "#FFFFFF",
  border: "#E5E7EB",
  muted: "#6B7280",
  text: "#111827",
  primary: "#0B1320",
  blue: "#2563EB",
  cardRadius: 4,
};

const toTitleCase = (str: string) =>
  str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const getRoomName = (categoryName: string) => {
  const room =
    categoryName && categoryName.includes("-")
      ? categoryName.split("-").slice(1).join("-").trim()
      : categoryName || "Unknown";

  return toTitleCase(room);
};

export default function DesignWorkspacePage() {
  const { showSnackbar } = useAppSnackbar();
  const { userId } = useAuth();
  const [, params] = useRoute("/studio/:id");
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [propertyDetails, setPropertyDetails] =
    useState<PropertyDetails | null>(null);
  const [activeSpace, setActiveSpace] = useState<string>("Kitchen");
  const [spaces, setSpaces] = useState<string[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewMode, setViewMode] = useState<"compare" | "single">("single");
  const [spaceImages, setSpaceImages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [compsImages, setCompsImages] = useState<any>();
  const [selectedBaselineIds, setSelectedBaselineIds] = useState<string[]>([]);
  const [selectedCompsIds, setSelectedCompsIds] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [iterationHistory, setIterationHistory] = useState<IterationItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [pastedImages, setPastedImages] = useState<
    { file: File; preview: string }[]
  >([]);
  const [isCompsExpanded, setIsCompsExpanded] = useState<boolean>(true);
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [exportSelections, setExportSelections] = useState<
    Record<string, { v: string; url: string; description: string }[]>
  >({});
  const [pastedImageUrls, setPastedImageUrls] = useState<string[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [thinkingEnabled, setThinkingEnabled] = useState<boolean>(false);
  const [uploadingCount, setUploadingCount] = useState<number>(0);

  const propertyId = useMemo(() => params?.id || "", [params?.id]);

  const selectedImages = useMemo(
    () => compsImages?.addresses?.[selectedAddress]?.images || [],
    [compsImages?.addresses, selectedAddress],
  );

  const selectedPreviewImages = useMemo(() => {
    // BASELINE: Search across all categories
    const categoriesObj = propertyDetails?.files?.mls_images?.categories || {};
    const allMlsImages = Object.values(categoriesObj).flatMap(
      (cat: any) => cat?.images || [],
    );
    const baseline = allMlsImages
      .filter((img) => selectedBaselineIds.includes(img.id))
      .map((img) => ({ ...img, source: "baseline" }));

    // COMPS: Search across all addresses
    const allCompsImages: any[] = [];
    if (compsImages?.addresses) {
      Object.values(compsImages.addresses)?.forEach((addr: any) => {
        if (addr?.images) allCompsImages?.push(...addr?.images);
      });
    }
    const comps = allCompsImages
      ?.filter((img: any) => selectedCompsIds.includes(img.id))
      ?.map((img: any) => ({ ...img, source: "comps" }));

    const current =
      currentImage && selectedUrls.includes(currentImage)
        ? [{ id: currentImage, url: currentImage, source: "current" }]
        : [];

    const iterations = iterationHistory
      .filter((item) => selectedUrls.includes(item.url))
      .map((item) => ({
        id: item.id,
        url: item.url,
        source: "iteration",
      }));

    // merge all
    const merged = [...baseline, ...comps, ...current, ...iterations];

    const map = new Map<string, any>();
    merged.forEach((img) => {
      if (!map.has(img.url)) {
        map.set(img.url, img);
      }
    });

    return Array.from(map.values());
  }, [
    propertyDetails,
    compsImages,
    currentImage,
    selectedUrls,
    iterationHistory,
    selectedBaselineIds,
    selectedCompsIds,
  ]);

  const allPreviewImages = useMemo(() => {
    const selected = selectedPreviewImages.map((img: any) => ({
      id: img.id,
      url: img.url,
      type: img.source, // baseline | comps
    }));

    const pasted = pastedImages.map((img, index) => ({
      id: `pasted-${index}`,
      url: img.preview,
      type: "pasted",
    }));

    return [...selected, ...pasted];
  }, [selectedPreviewImages, pastedImages]);

  const groupedIterations = useMemo(() => {
    const map: Record<string, typeof iterationHistory> = {};

    iterationHistory.forEach((item) => {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    });

    return map;
  }, [iterationHistory]);

  const openPreview = useCallback((url: string) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewUrl(null);
  }, []);

  const handleSwapWithCurrent = useCallback((item: any) => {
    setCurrentImage(item.url);
  }, []);

  const toggleCurrentSelect = useCallback(() => {
    if (!currentImage) return;

    setSelectedUrls((prev) =>
      prev.includes(currentImage)
        ? prev.filter((u) => u !== currentImage)
        : [...prev, currentImage],
    );
  }, [currentImage]);

  const toggleIterationSelect = useCallback((url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
    );
  }, []);

  const saveIterationToHistory = useCallback(
    (image: { id?: string; url: string; description: string }) => {
      // Keep the server-generated id so this iteration can be used as a
      // base image in later regenerations without a page reload.
      setIterationHistory((prev) => [
        {
          id: image?.id || uuidv4(),
          url: image?.url,
          description: image?.description,
          category: activeSpace,
        },
        ...prev,
      ]);
    },
    [activeSpace],
  );

  const confirmDeleteIteration = async () => {
    if (!deleteTargetId) return;

    setDeleteLoading(true);

    try {
      await api.deleteIterationImages(
        propertyId,
        [deleteTargetId],
        String(userId),
      );

      setIterationHistory((prev) =>
        prev.filter((item) => item.id !== deleteTargetId),
      );

      if (
        currentImage ===
        iterationHistory.find((i) => i.id === deleteTargetId)?.url
      ) {
        setCurrentImage(null);
      }

      showSnackbar("Iteration image deleted", "success");
    } catch {
      showSnackbar("Failed to delete iteration image", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteTargetId(null);
    }
  };

  const handleRemoveSelected = useCallback(
    (img: any) => {
      if (img.type === "baseline") {
        setSelectedBaselineIds((prev) => prev.filter((x) => x !== img.id));
      } else if (img.type === "comps") {
        setSelectedCompsIds((prev) => prev.filter((x) => x !== img.id));
      } else if (img.type === "pasted") {
        const index = pastedImages.findIndex((_, i) => `pasted-${i}` === img.id);

        if (index !== -1) {
          URL.revokeObjectURL(pastedImages[index].preview);
          setPastedImages((prev) => prev.filter((_, i) => i !== index));
        }
      } else if (img.type === "current" || img.type === "iteration") {
        setSelectedUrls((prev) => prev.filter((u) => u !== img.url));
      }
    },
    [pastedImages],
  );

  const toggleBaselineSelect = useCallback((id: string) => {
    setSelectedBaselineIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleCompsSelect = useCallback((id: string) => {
    setSelectedCompsIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleViewMode = useCallback(
    (
      _event: React.MouseEvent<HTMLElement>,
      newMode: "compare" | "single" | null,
    ) => {
      if (newMode) setViewMode(newMode);
    },
    [],
  );

  const handleNext = useCallback(
    (e: any) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev < spaceImages?.length - 1 ? prev + 1 : 0));
    },
    [spaceImages?.length],
  );

  const handlePrev = useCallback(
    (e: any) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : spaceImages?.length - 1));
    },
    [spaceImages?.length],
  );

  /**
   * Run a regeneration request: shows the loading bubble, calls the API,
   * appends the AI response (description + images) and auto-adds results
   * to the iteration timeline. When `attachRetry` is true (non-thinking
   * runs), the response card offers a one-click "regenerate with thinking".
   */
  const runGeneration = useCallback(
    async (payload: ChatRegenerateRequest, attachRetry: boolean) => {
      setIsGenerating(true);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: payload.thinking
            ? "Thinking through your design..."
            : "Generating your design...",
          isLoading: true,
        },
      ]);

      try {
        const res = await api.regenerateDesign(payload);

        // One generated image per base image — keep them all, with server IDs.
        const newImages = (res?.regenerated_images || [])
          .filter((img) => img?.url)
          .map((img) => ({
            id: img.id,
            url: img.url,
            description: res?.description || "New design generated.",
          }));

        setIsGenerating(false);

        /* ========= ADD AI RESPONSE (single card: description + images) ========= */
        setMessages((prev) => [
          ...prev.filter((m) => !m.isLoading),
          {
            sender: "ai",
            text: res?.description || "New design generated.",
            images: newImages.map((img) => ({ url: img.url })),
            ...(attachRetry && newImages.length > 0
              ? { retryPayload: { ...payload, thinking: true } }
              : {}),
          },
        ]);

        /* ========= WARN ON PARTIAL FAILURE ========= */
        const requested = res?.input_count ?? 0;
        if (requested > 0 && newImages.length < requested) {
          showSnackbar(
            `Generated ${newImages.length} of ${requested} images — some failed. Please try again.`,
            "warning",
          );
        }

        /* ========= AUTO-ADD TO TIMELINE ========= */
        if (newImages.length > 0) {
          newImages.forEach((img) => saveIterationToHistory(img));
          setCurrentImage(newImages[0].url);
        }
      } catch (err) {
        setIsGenerating(false);
        console.log(err);
        setMessages((prev) => prev.filter((m) => !m.isLoading));
        showSnackbar("Failed to regenerate design", "error");
      }
    },
    [saveIterationToHistory, showSnackbar],
  );

  const handleRetryWithThinking = useCallback(
    (msgIndex: number) => {
      if (isGenerating) return;

      const payload = messages[msgIndex]?.retryPayload;
      if (!payload) return;

      // Remove the offer from the card so it can't be spammed.
      setMessages((prev) =>
        prev.map((m, i) =>
          i === msgIndex ? { ...m, retryPayload: undefined } : m,
        ),
      );

      runGeneration(payload, false);
    },
    [isGenerating, messages, runGeneration],
  );

  const handleExecute = useCallback(async () => {
    if (isGenerating) return;

    // Don't fire while pasted references are still uploading — their URLs
    // wouldn't be in the payload yet.
    if (uploadingCount > 0) {
      showSnackbar("Please wait for pasted images to finish uploading", "info");
      return;
    }

    if (!inputText.trim() && allPreviewImages.length === 0) return;

    const userMessage = inputText;

    const chatImages = allPreviewImages.map((img) => ({
      url: img.url,
    }));

    /* ========= BUILD PAYLOAD ========= */
    // `images` = BASE images (the user's own room photos / iterations) — the
    // backend generates one redesigned output per entry.
    // `reference_images` = style-only references (comps photos + pasted uploads).

    const images: Record<string, string> = {};

    // Base: selected iteration / current images (resolved to server IDs)
    selectedUrls.forEach((url) => {
      const img = iterationHistory.find((i) => i.url === url);

      if (img) {
        images[img.id] = img.category || activeSpace;
      } else {
        console.warn("Selected image not found in iteration history:", url);
      }
    });

    // Base: the user's own room photos
    selectedBaselineIds.forEach((id) => {
      // Search across all categories
      const categoriesObj = propertyDetails?.files?.mls_images?.categories || {};
      let foundImg: any = null;
      let foundCategory = activeSpace;

      for (const [cat, data] of Object.entries(categoriesObj)) {
        const img = (data as any)?.images?.find((i: any) => i.id === id);
        if (img) {
          foundImg = img;
          foundCategory = getRoomName(cat);
          break;
        }
      }

      if (foundImg) images[id] = foundCategory;
    });

    // References: comps photos (style inspiration) + pasted uploads
    const referenceUrls: string[] = [...pastedImageUrls];

    selectedCompsIds.forEach((id) => {
      // Search across all addresses
      if (compsImages?.addresses) {
        for (const data of Object.values(compsImages.addresses)) {
          const img = (data as any)?.images?.find((i: any) => i?.id === id);
          if (img?.url) {
            referenceUrls.push(img.url);
            break;
          }
        }
      }
    });

    const payload = {
      property_id: propertyId,
      images,
      reference_images: referenceUrls,
      user_feedback: userMessage,
      user_id: userId,
      thinking: thinkingEnabled,
    };

    /* ========= ADD USER MESSAGE IMMEDIATELY ========= */

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
        images: chatImages,
      },
    ]);

    /* ========= CLEAR INPUT UI IMMEDIATELY ========= */

    setInputText("");

    pastedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setPastedImages([]);
    setPastedImageUrls([]);

    setSelectedBaselineIds([]);
    setSelectedCompsIds([]);
    setSelectedUrls([]);

    /* ========= RUN GENERATION (offers thinking retry on non-thinking runs) ========= */
    await runGeneration(payload, !payload.thinking);
  }, [
    isGenerating,
    selectedBaselineIds,
    selectedCompsIds,
    pastedImages,
    inputText,
    allPreviewImages,
    propertyId,
    pastedImageUrls,
    userId,
    propertyDetails,
    selectedUrls,
    iterationHistory,
    activeSpace,
    compsImages,
    selectedAddress,
    thinkingEnabled,
    runGeneration,
    uploadingCount,
    showSnackbar,
  ]);

  const chatHistory = useCallback((chatHistory: any[]): ChatMessage[] => {
    if (!chatHistory?.length) return [];

    return chatHistory.map(
      (msg): ChatMessage => ({
        sender: msg.role === "assistant" ? "ai" : "user",

        text:
          msg.role === "assistant" ? msg.description || "" : msg.content || "",

        images:
          msg.images?.length > 0
            ? msg.images.map((img: any) => ({ url: img.url }))
            : [],
      }),
    );
  }, []);

  const iterationHistoryData = (apiHistory: any[], defaultCategory: string) => {
    if (!apiHistory?.length) return [];

    return apiHistory
      .slice()
      .reverse()
      .map((item, index) => ({
        id: item.id,
        v: `v${(apiHistory.length - index).toFixed(1)}`,
        url: item.url,
        description: "Saved iteration",
        category: defaultCategory,
      }));
  };

  const scrollToBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, []);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const details = await api?.getPropertyDetails(propertyId, String(userId));

      setPropertyDetails(details);

      const mappedMessages = chatHistory(details?.chat_history || []);
      setMessages(mappedMessages);
      setTimeout(scrollToBottom, 0);

      const categoriesObj = details?.files?.mls_images?.categories || {};

      // ---------- GET MLS IMAGES ----------
      const mlsImages = Object.values(categoriesObj).flatMap(
        (cat: any) => cat?.images || [],
      );

      const spaceMap = new Map<string, string>(); // key = lowercase, value = Title Case

      Object.entries(categoriesObj).forEach(([cat, data]: any) => {
        const hasImages = (data?.images || []).length > 0;

        if (!hasImages) return;

        const title = getRoomName(cat);
        const normalized = title.toLowerCase();

        if (!spaceMap.has(normalized)) {
          spaceMap.set(normalized, title);
        }
      });

      let extractedSpaces = Array.from(spaceMap.values());

      extractedSpaces.sort((a, b) => a.localeCompare(b));

      const unknownIndex = extractedSpaces.findIndex(
        (s) => s.toLowerCase() === "unknown",
      );

      if (unknownIndex !== -1) {
        const [unknown] = extractedSpaces.splice(unknownIndex, 1);
        extractedSpaces.push(unknown);
      }

      const finalSpaces =
        extractedSpaces?.length > 0
          ? extractedSpaces
          : ["Kitchen", "Living Room"];

      setSpaces(finalSpaces);

      // ---------- GROUP IMAGES BY ROOM (INCLUDING UNKNOWN) ----------
      const groupedImages: Record<string, any[]> = {};

      Object.entries(categoriesObj).forEach(([categoryName, data]: any) => {
        const room = getRoomName(categoryName);

        if (!groupedImages[room]) groupedImages[room] = [];

        (data?.images || []).forEach((img: any) => {
          groupedImages[room].push(img);
        });
      });

      // ---------- SET DEFAULT IMAGES ----------
      const firstSpace = finalSpaces[0];

      setSpaceImages(groupedImages[firstSpace] || mlsImages);

      setActiveSpace(firstSpace);

      const apiIterations = details?.iteration_history || [];

      if (apiIterations.length > 0) {
        const mappedIterations = iterationHistoryData(
          apiIterations,
          activeSpace || "General",
        );

        setIterationHistory(mappedIterations);

        // set latest as current image
        setCurrentImage(mappedIterations[0]?.url || null);
      }
      // ---------- STORE COMPS IMAGES ----------
      const comps = details?.files?.comps_images || [];
      setCompsImages(comps);

      const firstAddress = comps ? Object.keys(comps?.addresses)[0] : "";
      setSelectedAddress(firstAddress);
    } finally {
      setLoading(false);
    }
  }, [
    propertyId,
    userId,
    chatHistory,
    scrollToBottom,
    activeSpace,
    showSnackbar,
  ]);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length === 0) return;

      e.preventDefault();

      // Track in-flight uploads so EXECUTE waits for them (avoids sending a
      // generation whose pasted references haven't finished uploading).
      setUploadingCount((c) => c + imageFiles.length);

      // Upload in parallel — the uploads are independent.
      await Promise.all(
        imageFiles.map(async (file) => {
          const preview = URL.createObjectURL(file);
          setPastedImages((prev) => [...prev, { file, preview }]);
          try {
            const res = await api.getImageUrl(
              propertyId,
              String(userId),
              file,
            );
            const url = res?.url;
            if (url) {
              setPastedImageUrls((prev) => [...prev, url]);
              setPastedImages((prev) =>
                prev.map((p) =>
                  p.preview === preview ? { ...p, preview: url } : p,
                ),
              );
            }
          } catch (err) {
            showSnackbar("Image upload failed", "error");
          } finally {
            setUploadingCount((c) => c - 1);
          }
        }),
      );
    },
    [propertyId, userId, showSnackbar],
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating, scrollToBottom]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeSpace]);

  useEffect(() => {
    if (!propertyId || !userId) {
      return;
    }

    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, propertyId]);

  useEffect(() => {
    if (iterationHistory?.length === 0) {
      setViewMode("single");
    }
  }, [iterationHistory]);

  useEffect(() => {
    if (!propertyDetails) return;

    const categoriesObj = propertyDetails?.files?.mls_images?.categories || {};

    const groupedImages: Record<string, any[]> = {};

    Object.entries(categoriesObj).forEach(([categoryName, data]: any) => {
      const room = getRoomName(categoryName);

      if (!groupedImages[room]) groupedImages[room] = [];

      (data?.images || []).forEach((img: any) => {
        groupedImages[room].push(img);
      });
    });

    setSpaceImages(groupedImages[activeSpace] || []);
    setCurrentIndex(0);
  }, [propertyDetails, activeSpace]);

  return (
    <>
      <Box
        height={{ xs: "auto", md: "100vh" }}
        minHeight={{ xs: "100vh", md: "100vh" }}
        bgcolor={ui.bg}
        display="flex"
        flexDirection="column"
        overflow={{ xs: "auto", md: "hidden" }}
      >
        <AppNavbar showBack={true} bgcolor={ui.bg} />
        {/* ================= MAIN LAYOUT ================= */}
        <Box
          flex={1}
          minHeight={0}
          display={{ xs: "block", md: "flex" }}
          gap={3}
          p={{ xs: 1.5, sm: 2, md: 3 }}
          alignItems="stretch"
          width="100%"
          maxWidth="100vw"
        >
          {/* ========== LEFT PANEL ========== */}
          <Box
            flex={{ md: 2 }}
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              height: "100%",
              overflow: "hidden",
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              {/* LEFT SIDE — TITLE + SUBTITLE */}
              <Box>
                {loading ? (
                  <>
                    <Skeleton width={300} height={40} />
                    <Skeleton width={150} height={30} />
                  </>
                ) : (
                  <>
                    <Typography
                      fontWeight={500}
                      sx={{ letterSpacing: 1, fontSize: 22 }}
                    >
                      {`${activeSpace} Transformation`}
                    </Typography>

                    <Typography
                      color={ui.muted}
                      sx={{ fontSize: 14, letterSpacing: 1 }}
                    >
                      ITERATIVE DELTA ANALYSIS
                    </Typography>
                  </>
                )}
              </Box>

              {/* RIGHT SIDE — BUTTONS */}
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewMode}
                size="small"
                sx={{
                  p: 1,
                  borderRadius: 999,
                  backgroundColor: "#fff",
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    border: "none",
                    borderRadius: 999,
                    px: 2.0,
                    py: 0.5,
                    fontSize: 12,
                    color: ui.muted,
                  },
                  "& .Mui-selected": {
                    backgroundColor: "#F3F4F6",
                    color: ui.primary,
                    fontWeight: 600,
                    boxShadow: "0px 2px 6px rgba(0,0,0,0.08)",
                    "&:hover": {
                      backgroundColor: "#F3F4F6",
                    },
                  },
                  "& .MuiToggleButton-root.Mui-disabled": {
                    border: "none !important",
                    opacity: 0.5,
                    backgroundColor: "transparent",
                  },
                }}
              >
                <ToggleButton value="compare" disabled={!currentImage}>
                  COMPARE
                </ToggleButton>
                <ToggleButton value="single">SINGLE</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                pr: 1,
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#D1D5DB",
                  borderRadius: 3,
                },
                pt: 1,
              }}
            >
              {/* ========== BASELINE + CURRENT ITERATION ========== */}
              <Grid container spacing={3} justifyContent="center">
                {/* ================= BASELINE COLUMN ================= */}
                <Grid
                  size={{ xs: 12, md: viewMode === "single" ? 12 : 6 }}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {/* HEADER ROW */}
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: 350,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 16,
                        letterSpacing: 1,
                        color: "#000",
                        textTransform: "uppercase",
                        fontWeight: 600,
                      }}
                    >
                      BASELINE
                    </Typography>

                    {loading ? (
                      <Skeleton width={180} height={50} sx={{ borderRadius: 2 }} />
                    ) : (
                      <FormControl size="small">
                        <InputLabel>Select Space</InputLabel>
                        <Select
                          value={activeSpace}
                          label="Select Space"
                          onChange={(e) => setActiveSpace(e.target.value)}
                          sx={{
                            minWidth: { xs: 150, sm: 200 },
                            bgcolor: "white",
                            borderRadius: 2,
                          }}
                        >
                          {spaces.map((space) => (
                            <MenuItem key={space} value={space}>
                              {space}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>

                  {/* BASELINE CARD */}
                  {loading ? (
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={270}
                      sx={{
                        maxWidth: 360,
                        borderRadius: ui.cardRadius,
                      }}
                    />
                  ) : (
                    <Card
                      onClick={() =>
                        toggleBaselineSelect(spaceImages[currentIndex]?.id)
                      }
                      sx={{
                        borderRadius: ui.cardRadius,
                        width: "100%",
                        position: "relative",
                        maxWidth: 360,
                        aspectRatio: "4 / 3",
                        overflow: "hidden",
                        backgroundColor: "white",
                        border: selectedBaselineIds?.includes(
                          spaceImages[currentIndex]?.id,
                        )
                          ? `3px solid ${ui.blue}`
                          : `1px solid ${ui.border}`,
                        cursor: "pointer",
                        "&:hover .preview-btn": { opacity: 1 },
                      }}
                    >
                      {spaceImages?.length > 0 ? (
                        <>
                          <CardMedia
                            component="img"
                            image={spaceImages[currentIndex]?.url}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: ui.cardRadius,
                            }}
                          />
                          <IconButton
                            className="preview-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPreview(spaceImages[currentIndex]?.url);
                            }}
                            sx={{
                              position: "absolute",
                              bottom: 8,
                              left: 8,
                              bgcolor: "rgba(0,0,0,0.6)",
                              color: "#fff",
                              width: 22,
                              height: 22,
                              opacity: 0,
                              transition: "0.2s",
                              "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                            }}
                          >
                            <OpenInFullIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          {selectedBaselineIds?.includes(
                            spaceImages[currentIndex]?.id,
                          ) && (
                              <Check
                                sx={{
                                  position: "absolute",
                                  top: 12,
                                  right: 12,
                                  bgcolor: ui.blue,
                                  color: "white",
                                  borderRadius: "50%",
                                  p: 0.6,
                                }}
                              />
                            )}

                          {spaceImages?.length > 1 && (
                            <>
                              <IconButton
                                onClick={(e) => handlePrev(e)}
                                sx={{
                                  position: "absolute",
                                  left: 16,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  bgcolor: "white",
                                  boxShadow: 2,
                                }}
                              >
                                <ChevronLeft />
                              </IconButton>

                              <IconButton
                                onClick={(e) => handleNext(e)}
                                sx={{
                                  position: "absolute",
                                  right: 16,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  bgcolor: "white",
                                  boxShadow: 2,
                                }}
                              >
                                <ChevronRight />
                              </IconButton>
                            </>
                          )}
                          <Chip
                            label={`${currentIndex + 1} / ${spaceImages?.length}`}
                            sx={{
                              position: "absolute",
                              bottom: 16,
                              right: 16,
                              bgcolor: "rgba(255,255,255,0.8)",
                            }}
                          />
                        </>
                      ) : (
                        <Box
                          sx={{
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: ui.muted,
                          }}
                        >
                          No images for {activeSpace}
                        </Box>
                      )}
                    </Card>
                  )}
                </Grid>

                {/* ================= CURRENT ITERATION ================= */}
                {viewMode === "compare" && currentImage && (
                  <Grid
                    size={{ xs: 12, md: 6 }}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: 420,
                        mb: 3,
                      }}
                    >
                      <Typography
                        sx={{
                          mt: 1,
                          fontSize: 16,
                          letterSpacing: 1,
                          color: "#2563EB",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        CURRENT ITERATION
                      </Typography>
                    </Box>

                    <Card
                      onClick={toggleCurrentSelect}
                      sx={{
                        position: "relative",
                        width: "100%",
                        maxWidth: 360,
                        aspectRatio: "4 / 3",
                        borderRadius: ui.cardRadius,
                        overflow: "hidden",
                        backgroundColor: "white",
                        border: selectedUrls.includes(currentImage)
                          ? `3px solid ${ui.blue}`
                          : `1px solid ${ui.border}`,
                        cursor: "pointer",
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={currentImage}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreview(currentImage);
                        }}
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          left: 8,
                          bgcolor: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          width: 22,
                          height: 22,
                          opacity: 0,
                          transition: "0.2s",
                          ".MuiCard-root:hover &": { opacity: 1 },
                          "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                        }}
                      >
                        <OpenInFullIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      {selectedUrls?.includes(currentImage) && (
                        <Check
                          sx={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            bgcolor: ui.blue,
                            color: "white",
                            borderRadius: "50%",
                            p: 0.6,
                          }}
                        />
                      )}
                    </Card>
                  </Grid>
                )}
              </Grid>

              <Box mt={4}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <History fontSize="small" sx={{ color: ui.muted }} />
                    <Typography
                      fontWeight={600}
                      sx={{ fontSize: 16, letterSpacing: 1 }}
                    >
                      ITERATION HISTORY
                    </Typography>
                  </Box>

                  {iterationHistory?.length > 0 && (
                    <Box display="flex" gap={1}>
                      <Button
                        variant="contained"
                        sx={{
                          bgcolor: "#000",
                          color: "white",
                          borderRadius: 3,
                          textTransform: "none",
                          px: 2.5,
                          fontSize: 12,
                          letterSpacing: 1,
                        }}
                        onClick={() => setExportOpen(true)}
                      >
                        EXPORT PACKAGE
                      </Button>
                      <IconButton
                        onClick={() =>
                          document.getElementById("iter-carousel")?.scrollBy({
                            left: -320,
                            behavior: "smooth",
                          })
                        }
                        sx={{
                          border: `1px solid ${ui.border}`,
                          bgcolor: "white",
                          width: 32,
                          height: 32,
                        }}
                      >
                        <ChevronLeft fontSize="small" />
                      </IconButton>

                      <IconButton
                        onClick={() =>
                          document.getElementById("iter-carousel")?.scrollBy({
                            left: 320,
                            behavior: "smooth",
                          })
                        }
                        sx={{
                          border: `1px solid ${ui.border}`,
                          bgcolor: "white",
                          width: 32,
                          height: 32,
                        }}
                      >
                        <ChevronRight fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {loading ? (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      overflow: "hidden",
                    }}
                  >
                    {[...Array(4)].map((_, i) => (
                      <Skeleton
                        key={i}
                        variant="rectangular"
                        sx={{
                          minWidth: "23%",
                          maxWidth: "23%",
                          height: 200,
                          borderRadius: 3,
                        }}
                      />
                    ))}
                  </Box>
                ) : iterationHistory?.length === 0 ? (
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: "center",
                      borderRadius: 3,
                      border: `1px solid ${ui.border}`,
                      color: ui.muted,
                      boxShadow: "none",
                    }}
                  >
                    No current iteration history to show
                  </Paper>
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      id="iter-carousel"
                      sx={{
                        display: "flex",
                        gap: 2,
                        overflowX: "auto",
                        scrollBehavior: "smooth",
                        "&::-webkit-scrollbar": { display: "none" },
                      }}
                    >
                      {iterationHistory?.map((item, i) => {
                        const isCurrent = item.url === currentImage;
                        const selected = selectedUrls.includes(item.url);
                        return (
                          <Paper
                            key={i}
                            onClick={() => {
                              toggleIterationSelect(item.url);
                            }}
                            sx={{
                              minWidth: "23%",
                              maxWidth: "23%",
                              height: 200,
                              borderRadius: 3,
                              border: selected
                                ? `3px solid ${ui.blue}`
                                : `1px solid ${ui.border}`,
                              overflow: "hidden",
                              position: "relative",
                              bgcolor: "white",
                              display: "flex",
                              cursor: "pointer",
                              "&:hover .swap-btn": { opacity: 1 },
                              "&:hover .preview-btn": { opacity: 1 },
                            }}
                          >
                            <IconButton
                              className="preview-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPreview(item.url);
                              }}
                              sx={{
                                position: "absolute",
                                bottom: 6,
                                left: 6,
                                bgcolor: "rgba(0,0,0,0.6)",
                                color: "#fff",
                                width: 22,
                                height: 22,
                                opacity: 0,
                                transition: "0.2s",
                                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                              }}
                            >
                              <OpenInFullIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            {selected && (
                              <Check
                                sx={{
                                  position: "absolute",
                                  top: 6,
                                  right: 6,
                                  bgcolor: ui.blue,
                                  color: "white",
                                  borderRadius: "50%",
                                  p: 0.4,
                                  zIndex: 4,
                                }}
                              />
                            )}
                            <Tooltip
                              title="Delete"
                              arrow
                              componentsProps={{
                                tooltip: {
                                  sx: {
                                    bgcolor: "#000",
                                    color: "#fff",
                                    fontSize: 11,
                                  },
                                },
                                arrow: { sx: { color: "#000" } },
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => setDeleteTargetId(item.id)}
                                sx={{
                                  position: "absolute",
                                  top: 6,
                                  left: 6,
                                  width: 22,
                                  height: 22,
                                  p: 0,
                                  bgcolor: "rgba(0,0,0,0.55)",
                                  color: "#fff",
                                  zIndex: 3,
                                  "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                                }}
                              >
                                <CloseIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>

                            {!isCurrent && (
                              <Tooltip
                                title="Swap with current iteration"
                                arrow
                                componentsProps={{
                                  tooltip: {
                                    sx: {
                                      bgcolor: "#000",
                                      color: "#fff",
                                      fontSize: 12,
                                    },
                                  },
                                  arrow: { sx: { color: "#000" } },
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSwapWithCurrent(item);
                                  }}
                                  sx={{
                                    position: "absolute",
                                    bottom: 6,
                                    right: 6,
                                    bgcolor: "rgba(0,0,0,0.6)",
                                    color: "#fff",
                                    opacity: 0,
                                    width: 22,
                                    height: 22,
                                    transition: "0.2s",
                                    zIndex: 3,
                                    "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                                    ".MuiPaper-root:hover &": { opacity: 1 },
                                  }}
                                >
                                  <SwapHorizIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <CardMedia
                              component="img"
                              image={item.url}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </Paper>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>

              <Box mt={4}>
                {/* HEADER + NAV BUTTONS */}
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                >
                  {/* LEFT SIDE — TITLE */}
                  <Box display="flex" alignItems="center" gap={1}>
                    <CollectionsOutlined
                      fontSize="small"
                      sx={{ color: ui.muted }}
                    />
                    <Typography
                      fontWeight={600}
                      sx={{ fontSize: 16, letterSpacing: 1 }}
                    >
                      MARKET COMPS
                    </Typography>
                  </Box>

                  {/* RIGHT SIDE — SELECT + ARROWS */}
                  <Box display="flex" alignItems="center" gap={1.5}>
                    {loading ? (
                      <Skeleton width={350} height={50} sx={{ borderRadius: 2 }} />
                    ) : (
                      <FormControl size="small">
                        <InputLabel>Select Address</InputLabel>
                        <Select
                          value={selectedAddress}
                          label="Select Address"
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          sx={{
                            minWidth: 260,
                            bgcolor: "white",
                            borderRadius: 2,
                          }}
                        >
                          {Object.keys(compsImages?.addresses || {}).map(
                            (addr) => (
                              <MenuItem key={addr} value={addr}>
                                {addr}
                              </MenuItem>
                            ),
                          )}
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </Box>

                {/* WRAPPER CARD */}
                {loading ? (
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={60}
                    sx={{ borderRadius: 3 }}
                  />
                ) : (
                  <Paper
                    sx={{
                      borderRadius: 3,
                      border: `1px solid ${ui.border}`,
                      overflow: "hidden",
                      boxShadow: "none",
                    }}
                  >
                    <Accordion
                      expanded={isCompsExpanded}
                      onChange={(_, expanded) => setIsCompsExpanded(expanded)}
                      disableGutters
                      elevation={0}
                    >
                      {/* HEADER = SELECTED ADDRESS */}
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          width="100%"
                        >
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Typography fontWeight={600}>
                              {selectedAddress}
                            </Typography>

                            <Chip
                              label={`${selectedImages.length} Images`}
                              size="small"
                              sx={{
                                bgcolor: "#EEF2FF",
                                color: "#000",
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            />
                          </Box>

                          <Typography fontSize={12} color={ui.muted}>
                            {compsImages?.addresses?.[selectedAddress]?.price ||
                              ""}{" "}
                            {compsImages?.addresses?.[selectedAddress]?.style
                              ? `• ${compsImages.addresses[selectedAddress].style}`
                              : ""}
                          </Typography>
                        </Box>
                      </AccordionSummary>

                      <AccordionDetails sx={{ pt: 0 }}>
                        <Box
                          sx={{
                            pr: 1,
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "repeat(2, 1fr)",
                              sm: "repeat(3, 1fr)",
                              md: "repeat(4, 1fr)",
                              lg: "repeat(5, 1fr)",
                            },
                            gap: 2,
                            "&::-webkit-scrollbar": { width: 6 },
                            "&::-webkit-scrollbar-thumb": {
                              backgroundColor: "#D1D5DB",
                              borderRadius: 3,
                            },
                          }}
                        >
                          {selectedImages.map((img: any) => {
                            const selected = selectedCompsIds.includes(img?.id);

                            return (
                              <Card
                                key={img.id}
                                onClick={() => toggleCompsSelect(img?.id)}
                                sx={{
                                  height: 170,
                                  borderRadius: 2,
                                  overflow: "hidden",
                                  position: "relative",
                                  cursor: "pointer",
                                  border: selected
                                    ? `3px solid ${ui.blue}`
                                    : `1px solid ${ui.border}`,
                                  "&:hover .preview-btn": { opacity: 1 },
                                }}
                              >
                                <IconButton
                                  className="preview-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPreview(img.url);
                                  }}
                                  sx={{
                                    position: "absolute",
                                    bottom: 6,
                                    left: 6,
                                    bgcolor: "rgba(0,0,0,0.6)",
                                    color: "#fff",
                                    width: 22,
                                    height: 22,
                                    opacity: 0,
                                    transition: "0.2s",
                                    "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                                  }}
                                >
                                  <OpenInFullIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                                <CardMedia
                                  component="img"
                                  image={img.url}
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                                {selected && (
                                  <Check
                                    sx={{
                                      position: "absolute",
                                      top: 6,
                                      right: 6,
                                      bgcolor: ui.blue,
                                      color: "white",
                                      borderRadius: "50%",
                                      p: 0.4,
                                    }}
                                  />
                                )}
                              </Card>
                            );
                          })}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Paper>
                )}
              </Box>
            </Box>
          </Box>
          {/* ========== RIGHT CHAT PANEL ========== */}
          <Box
            mt={{ xs: 4, md: 0 }}
            display="flex"
            flexDirection="column"
            flexShrink={0}
            width={{ xs: "100%", md: 440 }}
            minWidth={{ xs: "100%", md: 420 }}
            minHeight={0}
            height="100%"
            overflow="hidden"
          >
            <Paper
              sx={{
                width: { xs: "100%" },
                p: 2,
                borderRadius: 3,
                border: `1px solid ${ui.border}`,
                display: "flex",
                flexDirection: "column",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.06)",
                bgcolor: "#FFFFFF",
                flex: 1,
                minHeight: 0,
                height: "100%",
                overflow: "hidden",
              }}
            >
              {/* HEADER */}
              <Box display="flex" gap={1} alignItems="center" sx={{ mb: 2 }}>
                <AutoAwesome fontSize="small" sx={{ color: "#000" }} />
                <Typography
                  fontWeight={700}
                  sx={{ fontSize: 16, letterSpacing: 1 }}
                >
                  DESIGN AGENT
                </Typography>
              </Box>

              {/* CHAT BODY */}
              <Box
                ref={chatContainerRef}
                flex={1}
                display="flex"
                flexDirection="column"
                gap={2}
                minHeight={0}
                sx={{
                  overflowY: "auto",
                  pr: 0.5,
                  "&::-webkit-scrollbar": { display: "none" },
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  maxWidth: "100%",
                  minWidth: 0,
                }}
              >
                {loading ? (
                  <Box display="flex" flexDirection="column" gap={2}>
                    {[...Array(3)].map((_, i) => {
                      const isRight = i % 2 !== 0;
                      return (
                        <Box
                          key={i}
                          display="flex"
                          flexDirection={isRight ? "row-reverse" : "row"}
                          gap={1}
                          alignItems="flex-start"
                          sx={{ alignSelf: isRight ? "flex-end" : "flex-start" }}
                        >
                          <Skeleton variant="circular" width={32} height={32} />
                          <Skeleton
                            variant="rectangular"
                            width={200}
                            height={60}
                            sx={{ borderRadius: 2 }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  messages?.map((msg, index) =>
                    msg?.sender === "ai" ? (
                      <Box
                        key={index}
                        display="flex"
                        gap={1}
                        alignItems="flex-start"
                      >
                        {/* AVATAR */}
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            bgcolor: "#EAECEF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                          }}
                        >
                          <AutoAwesome fontSize="small" />
                        </Box>

                        {/* BUBBLE */}
                        <Paper
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "#EAECEF",
                            color: "white",

                            maxWidth: "85%",
                            width: "fit-content",

                            display: "flex",
                            flexDirection: "column",
                            gap: 1,

                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",

                            ...(msg?.isLoading
                              ? {
                                animation: "blink 1.2s infinite",
                                "@keyframes blink": {
                                  "0%": { opacity: 1 },
                                  "50%": { opacity: 0.3 },
                                  "100%": { opacity: 1 },
                                },
                              }
                              : {}),
                          }}
                        >
                          {msg?.images && msg.images.length > 0 && (
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns:
                                  msg.images.length > 1
                                    ? "repeat(2, 1fr)"
                                    : "1fr",
                                gap: 1,
                                width: msg.images.length > 1 ? 340 : 260,
                                maxWidth: "100%",
                              }}
                            >
                              {msg.images.map((img, i) => (
                                <Box
                                  key={i}
                                  component="img"
                                  src={img.url}
                                  onLoad={scrollToBottom}
                                  onClick={() => openPreview(img.url)}
                                  sx={{
                                    width: "100%",
                                    aspectRatio: "4 / 3",
                                    objectFit: "cover",
                                    borderRadius: 1.5,
                                    border: `1px solid ${ui.border}`,
                                    cursor: "pointer",
                                    transition: "0.2s",
                                    transform: "translateZ(0)",
                                    backfaceVisibility: "hidden",
                                    "&:hover": {
                                      transform: "scale(1.03)",
                                      boxShadow: "0px 4px 12px rgba(0,0,0,0.25)",
                                    },
                                  }}
                                />
                              ))}
                            </Box>
                          )}

                          <Typography color="#000">{msg?.text}</Typography>

                          {msg?.retryPayload && (
                            <Box
                              sx={{
                                mt: 0.5,
                                pt: 1.25,
                                borderTop: `1px solid ${ui.border}`,
                              }}
                            >
                              <Typography
                                fontSize={12}
                                color={ui.muted}
                                sx={{ mb: 0.75 }}
                              >
                                Want a better result? Regenerate this design
                                with AI thinking enabled.
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={isGenerating}
                                onClick={() => handleRetryWithThinking(index)}
                                startIcon={
                                  <AutoAwesome sx={{ fontSize: 14 }} />
                                }
                                sx={{
                                  textTransform: "none",
                                  fontSize: 12,
                                  color: ui.text,
                                  borderColor: ui.border,
                                  bgcolor: "#fff",
                                  "&:hover": {
                                    bgcolor: "#fff",
                                    borderColor: ui.muted,
                                  },
                                }}
                              >
                                Regenerate with Thinking
                              </Button>
                            </Box>
                          )}
                        </Paper>
                      </Box>
                    ) : (
                      <Paper
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "#EAECEF",
                          color: "white",
                          alignSelf: "flex-end",
                          maxWidth: { xs: "100%", sm: "85%" },
                          width: "fit-content",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,

                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {msg?.images && msg.images.length > 0 && (
                          <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                            {msg.images.map((img, i) => (
                              <Box
                                key={i}
                                component="img"
                                src={img.url}
                                onClick={() => openPreview(img.url)}
                                sx={{
                                  width: 72,
                                  height: 72,
                                  objectFit: "cover",
                                  borderRadius: 1.5,
                                  border: `1px solid ${ui.border}`,
                                  cursor: "pointer",
                                  transition: "0.2s",
                                  "&:hover": {
                                    transform: "scale(1.05)",
                                    boxShadow: "0px 4px 12px rgba(0,0,0,0.25)",
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        )}

                        <Typography
                          color="#000"
                          sx={{
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {msg?.text}
                        </Typography>
                      </Paper>
                    ),
                  ))}

                {/* Auto-scroll anchor */}
                <div ref={chatEndRef} />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* INPUT BAR */}
              <Box
                sx={{
                  border: `1px solid ${ui.border}`,
                  borderRadius: 4,
                  backgroundColor: "#F3F5F7",
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.2,
                }}
              >
                {allPreviewImages?.length > 0 && (
                  <Box
                    sx={{
                      maxHeight: 130,
                      overflowY: "auto",
                      pr: 0.5,
                      mb: 1.2,

                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1.2,
                      alignItems: "flex-start",

                      "&::-webkit-scrollbar": { width: 6 },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#D1D5DB",
                        borderRadius: 3,
                      },
                    }}
                  >
                    {allPreviewImages?.map((img) => (
                      <Box
                        key={img.id}
                        sx={{
                          position: "relative",
                          width: 60,
                          height: 60,
                          borderRadius: 2,
                          overflow: "hidden",
                          border: `1px solid ${ui.border}`,
                          boxShadow: "0px 2px 4px rgba(0,0,0,0.08)",
                          flexShrink: 0,
                          bgcolor: "#fff",
                        }}
                      >
                        <img
                          src={img.url}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />

                        <IconButton
                          size="small"
                          onClick={() => handleRemoveSelected(img)}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            width: 14,
                            height: 14,
                            bgcolor: "rgba(0,0,0,0.65)",
                            color: "#fff",
                            zIndex: 2,
                            "&:hover": {
                              bgcolor: "rgba(0,0,0,0.85)",
                            },
                          }}
                        >
                          <Typography fontSize={12} lineHeight={1}>
                            <CloseIcon sx={{ fontSize: 12 }} />
                          </Typography>
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    selectedPreviewImages.length > 0
                      ? ""
                      : "Direct the AI: 'Change the countertop to marble'..."
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleExecute();
                    }
                  }}
                  onPaste={handlePaste}
                  rows={4}
                  style={{
                    flex: 1,
                    minHeight: 90,
                    maxHeight: 140,
                    overflowY: "auto",
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: 15,
                    lineHeight: "1.6",
                    color: ui.text,
                    resize: "none",
                    fontFamily: "inherit",
                  }}
                />

                {/* THINKING TOGGLE + EXECUTE BUTTON */}
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1.5}
                >
                  <Tooltip
                    title="Let the AI reason before generating — higher quality, slower"
                    arrow
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={thinkingEnabled}
                          onChange={(e) => setThinkingEnabled(e.target.checked)}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <AutoAwesome sx={{ fontSize: 14, color: ui.muted }} />
                          <Typography fontSize={12} color={ui.muted}>
                            Thinking
                          </Typography>
                        </Box>
                      }
                      sx={{ ml: 0, mr: 0 }}
                    />
                  </Tooltip>

                  <Button
                    variant="contained"
                    onClick={handleExecute}
                    disabled={isGenerating || uploadingCount > 0}
                    sx={{
                      bgcolor: ui.primary,
                      color: "#fff",
                      borderRadius: 3,
                      px: 2.2,
                      minHeight: 44,
                      flex: 1,
                      maxWidth: 220,
                      textTransform: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      "&:hover": { bgcolor: ui.primary },
                    }}
                  >
                    EXECUTE <ChevronRight fontSize="small" />
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
      <FinalSelectionModal
        exportOpen={exportOpen}
        setExportOpen={setExportOpen}
        groupedIterations={groupedIterations}
        exportSelections={exportSelections}
        setExportSelections={setExportSelections}
        propertyId={propertyId}
        userId={userId}
      />
      <ConfirmModal
        open={!!deleteTargetId}
        title="Delete Iteration History"
        description="Are you sure you want to delete this image from iteration history? This action cannot be reversed."
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        onConfirm={confirmDeleteIteration}
        onCancel={() => setDeleteTargetId(null)}
      />
      <ImagePreviewModal
        open={previewOpen}
        imageUrl={previewUrl}
        onClose={closePreview}
      />
    </>
  );
}
