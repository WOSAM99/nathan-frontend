import { useState, useEffect, useRef } from "react";
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
} from "@mui/material";
import { useRoute } from "wouter";
import { api, PropertyDetails } from "@/lib/api";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";
import { useAuth } from "@/contexts/AuthContext";
import ProfileMenu from "@/components/ProfileMenu";
import { Menu, MenuItem } from "@mui/material";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Check from "@mui/icons-material/Check";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import CollectionsOutlined from "@mui/icons-material/CollectionsOutlined";
import History from "@mui/icons-material/History";

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

export default function DesignWorkspacePage() {
  const { showSnackbar } = useAppSnackbar();
  const { userId } = useAuth();
  const [, params] = useRoute("/studio/:id");
  const propertyId = params?.id || "";
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const [propertyDetails, setPropertyDetails] =
    useState<PropertyDetails | null>(null);
  const [activeSpace, setActiveSpace] = useState("Kitchen");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [spaces, setSpaces] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    [],
  );
  const [viewMode, setViewMode] = useState<"compare" | "single">("single");
  const [spaceImages, setSpaceImages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [compsImages, setCompsImages] = useState<any[]>([]);
  const [selectedBaselineIds, setSelectedBaselineIds] = useState<string[]>([]);
  const [selectedCompsIds, setSelectedCompsIds] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [iterationHistory, setIterationHistory] = useState<
    { v: string; url: string; description: string }[]
  >([]);
  const [versionCounter, setVersionCounter] = useState(1.1);

  // const [hasMore, setHasMore] = useState(true);
  // const [loadingOlder, setLoadingOlder] = useState(false);

  // const loadOlderMessages = async () => {
  //   if (loadingOlder || !hasMore) return;

  //   setLoadingOlder(true);

  //   setTimeout(() => {
  //     if (messages.length > 50) {
  //       setHasMore(false);
  //     }

  //     setLoadingOlder(false);
  //   }, 1000);
  // };

  // const checkIfAtBottom = () => {
  //   if (!chatContainerRef.current) return true;

  //   const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

  //   return scrollHeight - scrollTop <= clientHeight + 10;
  // };

  const toggleBaselineSelect = (id: string) => {
    setSelectedBaselineIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleCompsSelect = (id: string) => {
    setSelectedCompsIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleViewMode = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: "compare" | "single" | null,
  ) => {
    if (newMode) setViewMode(newMode);
  };

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNext = (e: any) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < spaceImages?.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = (e: any) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : spaceImages?.length - 1));
  };

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeSpace]);

  const handleExecute = async () => {

    if (selectedBaselineIds.length === 0 && selectedCompsIds.length === 0) {
    showSnackbar(
      "Please select at least one image (Baseline or Market Comps) to generate a new design",
      "warning"
    );
    return;
  }

    if (!inputText.trim()) return;

    const userMessage = inputText;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);

    setInputText("");

    // Show generating message
    setIsGenerating(true);
    setMessages((prev) => [
      ...prev,
      { sender: "ai", text: "Generating your design..." },
    ]);

    const payload = {
      property_id: propertyId,
      image_ids: [...selectedBaselineIds, ...selectedCompsIds],
      user_feedback: userMessage,
    };

    try {
      const res = await api.regenerateDesign(payload);

      const newImageUrl = res.regenerated_images?.[0]?.url;

      if (!newImageUrl) {
        throw new Error("No image returned");
      }

      // Remove loading message
      setIsGenerating(false);
      setMessages((prev) => prev.slice(0, -1));

      // Add real AI message
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res?.description || "New design generated.",
        },
      ]);

      // SET CURRENT ITERATION IMAGE
      setCurrentImage(newImageUrl);

      // ADD TO ITERATION HISTORY
      const newVersion = `v${versionCounter?.toFixed(1)}`;

      setIterationHistory((prev) => [
        {
          v: newVersion,
          url: newImageUrl,
          description: res?.description,
        },
        ...prev,
      ]);

      // Increment version
      setVersionCounter((v) => v + 0.1);
    } catch (err) {
      setIsGenerating(false);
      setMessages((prev) => prev.slice(0, -1));
      showSnackbar("Failed to regenerate design", "error");
    }
  };

  useEffect(() => {
    if (iterationHistory.length === 0) {
      setViewMode("single");
    }
  }, [iterationHistory]);

  useEffect(() => {
    if (!propertyId || !userId) {
      return;
    }

    const loadDetails = async () => {
      try {
        const details = await api?.getPropertyDetails(propertyId, userId);

        setPropertyDetails(details);

        // ---------- GET MLS IMAGES ----------
        const mlsImages = (details as any)?.mls_images || [];

        // ---------- EXTRACT SPACES (KEEP UNKNOWN) ----------
        const extractedSpaces: string[] = Array.from(
          new Set(
            mlsImages.map((img: any) => {
              const cat = img?.category as string | undefined;

              return cat && cat.includes("-")
                ? cat.split("-").slice(1).join("-").trim()
                : cat || "Unknown";
            }),
          ),
        );

        // Sort alphabetically
        extractedSpaces?.sort();

        // Move "Unknown" to the bottom if present
        const unknownIndex = extractedSpaces?.indexOf("unknown");
        if (unknownIndex !== -1) {
          extractedSpaces?.splice(unknownIndex, 1);
          extractedSpaces?.push("Unknown");
        }

        const finalSpaces =
          extractedSpaces?.length > 0
            ? extractedSpaces
            : ["Kitchen", "Living Room"];

        setSpaces(finalSpaces);

        // ---------- GROUP IMAGES BY ROOM (INCLUDING UNKNOWN) ----------
        const groupedImages: Record<string, any[]> = {};

        mlsImages?.forEach((img: any) => {
          let room =
            img.category && img.category.includes("-")
              ? img.category.split("-").slice(1).join("-").trim()
              : img.category || "Unknown";

          if (!groupedImages[room]) groupedImages[room] = [];
          groupedImages[room]?.push(img);
        });

        // ---------- SET DEFAULT IMAGES ----------
        const firstSpace = finalSpaces[0];

        setSpaceImages(groupedImages[firstSpace] || mlsImages);

        setActiveSpace(firstSpace);

        // ---------- STORE COMPS IMAGES ----------
        const comps = (details as any)?.comps_images || [];
        setCompsImages(comps);
      } catch (err) {
        showSnackbar("Failed to load property details", "error");
      }
    };

    loadDetails();
  }, [userId, propertyId]);

  useEffect(() => {
    if (!propertyDetails) return;

    const mlsImages = propertyDetails?.mls_images || [];

    const imagesForSpace = mlsImages?.filter((img: any) => {
      const raw = img?.category || "";

      const room =
        raw && raw.includes("-")
          ? raw.split("-").slice(1).join("-").trim()
          : raw;

      return room?.toLowerCase() === activeSpace?.toLowerCase();
    });

    setSpaceImages(imagesForSpace);
  }, [propertyDetails, activeSpace]);

  return (
    <Box minHeight="100vh" bgcolor={ui.bg}>
      {/* ================= HEADER — IMAGE + USES PROFILE MENU ================= */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={3}
        py={1.8}
        bgcolor="white"
        borderBottom={`1px solid ${ui.border}`}
      >
        {/* LEFT SIDE: LOGO + STUDIO + ACTIVE SPACE */}
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 22,
              height: 22,
              bgcolor: "#0b1320",
              borderRadius: 1,
            }}
          />
          <Typography sx={{ fontSize: 14, letterSpacing: 1 }}>
            DESIGN AI WORKSPACE
          </Typography>

          <Box>
            <Chip
              label={`ACTIVE SPACE  ${activeSpace}`}
              variant="outlined"
              onClick={openMenu}
              deleteIcon={<ArrowDropDown />}
              onDelete={openMenu}
              sx={{
                ml: 2,
                borderRadius: 999,
                borderColor: ui.border,
                color: ui.text,
                cursor: "pointer",
              }}
            />

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={closeMenu}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 180,
                  borderRadius: 2,
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
                },
              }}
            >
              {spaces.map((space) => (
                <MenuItem
                  key={space}
                  onClick={() => {
                    setActiveSpace(space);
                    closeMenu();
                  }}
                >
                  {space}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>

        {/* RIGHT SIDE: AUTO-SAVED + EXPORT + PROFILE MENU */}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="contained"
            sx={{
              bgcolor: ui.primary,
              color: "white",
              borderRadius: 999,
              textTransform: "none",
              px: 2.5,
              fontSize: 12,
              letterSpacing: 1,
            }}
          >
            EXPORT PACKAGE
          </Button>

          {/* PROFILE MENU */}
          <ProfileMenu />
        </Box>
      </Box>

      {/* ================= MAIN LAYOUT ================= */}
      <Box
        display={{ xs: "block", md: "flex" }}
        gap={3}
        p={{ xs: 1.5, sm: 2, md: 3 }}
        alignItems="stretch"
        width="100%"
        maxWidth="100vw"
        overflow="hidden"
      >
        {/* ========== LEFT PANEL ========== */}
        <Box
          flex={{ md: 2 }}
          width={{ xs: "100%", md: "calc(100vw - 540px)" }}
          maxWidth="100%"
          sx={{ overflowX: "hidden" }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            {/* LEFT SIDE — TITLE + SUBTITLE */}
            <Box>
              <Typography
                variant="h5"
                fontWeight={500}
                sx={{ letterSpacing: 1 }}
              >
                {`${activeSpace} Transformation`}
              </Typography>

              <Typography color={ui.muted} sx={{ fontSize: 14 }}>
                ITERATIVE DELTA ANALYSIS
              </Typography>
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
              <ToggleButton
                value="compare"
                disabled={iterationHistory.length === 0}
              >
                COMPARE
              </ToggleButton>
              <ToggleButton value="single">SINGLE</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* ========== BASELINE + CURRENT ITERATION (IMAGE-ACCURATE) ========== */}
          <Grid container spacing={{ xs: 1.5, md: 2 }}>
            <Grid
              size={{ xs: viewMode === "single" ? 12 : 6 }}
              sx={{
                display: "flex",
                justifyContent: viewMode === "single" ? "center" : "flex-start",
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  letterSpacing: 1,
                  color: ui.muted,
                  textTransform: "uppercase",
                }}
              >
                BASELINE
              </Typography>
            </Grid>

            {viewMode === "single" ? null : (
              <Grid size={{ xs: 6 }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    letterSpacing: 1,
                    color: "#2563EB",
                    textTransform: "uppercase",
                  }}
                >
                  CURRENT ITERATION
                </Typography>
              </Grid>
            )}
            {/* ========== BASELINE CARD ========== */}
            <Grid
              size={{ xs: viewMode === "single" ? 12 : 6 }}
              sx={{
                display: "flex",
                justifyContent: viewMode === "single" ? "center" : "flex-start",
              }}
            >
              <Card
                onClick={() =>
                  toggleBaselineSelect(spaceImages[currentIndex].id)
                }
                sx={{
                  borderRadius: ui.cardRadius,
                  position: "relative",
                  width: 420,
                  aspectRatio: "4 / 3",
                  overflow: "hidden",
                  backgroundColor: "white",
                  mx: viewMode === "single" ? "auto" : 0,
                  border: selectedBaselineIds?.includes(
                    spaceImages[currentIndex]?.id,
                  )
                    ? `3px solid ${ui.blue}`
                    : `1px solid ${ui.border}`,
                  cursor: "pointer",
                }}
              >
                {spaceImages?.length > 0 ? (
                  <>
                    <CardMedia
                      component="img"
                      image={spaceImages[currentIndex].url}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: ui.cardRadius,
                      }}
                    />
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

                    <Chip
                      label={`${currentIndex + 1} / ${spaceImages.length}`}
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
            </Grid>

            {/* ========== CURRENT ITERATION ========== */}
            {viewMode === "compare" && currentImage && (
              <Grid size={{ xs: 6 }}>
                <Card
                  sx={{
                    borderRadius: ui.cardRadius,
                    width: 420,
                    aspectRatio: "4 / 3",
                    overflow: "hidden",
                    backgroundColor: "white",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={currentImage}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: ui.cardRadius,
                    }}
                  />
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
                <Typography fontWeight={600}>ITERATION HISTORY</Typography>
              </Box>

              {iterationHistory.length > 0 && (
                <Box display="flex" gap={1}>
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

            {iterationHistory.length === 0 ? (
              <Paper
                sx={{
                  p: 3,
                  textAlign: "center",
                  borderRadius: 3,
                  border: `1px solid ${ui.border}`,
                  color: ui.muted,
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
                  {iterationHistory?.map((item, i) => (
                    <Paper
                      key={i}
                      sx={{
                        minWidth: "23%",
                        maxWidth: "23%",
                        height: 200,
                        borderRadius: 3,
                        border: `1px solid ${ui.border}`,
                        overflow: "hidden",
                        position: "relative",
                        bgcolor: "white",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          bgcolor: ui.primary,
                          color: "white",
                          px: 1,
                          py: 0.3,
                          borderRadius: 1,
                          fontSize: 11,
                          fontWeight: 600,
                          zIndex: 2,
                        }}
                      >
                        {item.v}
                      </Box>

                      <CardMedia
                        component="img"
                        height="140"
                        image={item.url}
                        sx={{ objectFit: "cover", width: "100%" }}
                      />
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* ================= MARKET COMPS CAROUSEL ================= */}

          <Box mt={4}>
            {/* HEADER + NAV BUTTONS */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <CollectionsOutlined
                  fontSize="small"
                  sx={{ color: ui.muted }}
                />
                <Typography fontWeight={600}>MARKET COMPS</Typography>
              </Box>

              <Box display="flex" gap={1}>
                <IconButton
                  onClick={() =>
                    document.getElementById("comps-carousel")?.scrollBy({
                      left: -450,
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
                    document.getElementById("comps-carousel")?.scrollBy({
                      left: 450,
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
            </Box>

            {/* WRAPPER CARD */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 3,
                border: `1px solid ${ui.border}`,
                width: "100%",
                overflow: "hidden",
              }}
            >
              <Box
                id="comps-carousel"
                sx={{
                  display: "flex",
                  gap: 2,
                  overflowX: compsImages?.length > 4 ? "auto" : "hidden",
                  scrollBehavior: "smooth",
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  justifyContent:
                    compsImages?.length <= 4 ? "center" : "flex-start",

                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {compsImages?.map((img: any, i: number) => (
                  <Card
                    key={i}
                    onClick={() => toggleCompsSelect(img.id)}
                    sx={{
                      flexShrink: 0,
                      width: {
                        xs: "100%",
                        sm: "50%",
                        md: "33.33%",
                        lg: "calc(25% - 12px)",
                      },
                      borderRadius: 3,
                      overflow: "hidden",
                      cursor: "pointer",
                      position: "relative",
                      border: selectedCompsIds?.includes(img.id)
                        ? `3px solid ${ui.blue}`
                        : `1px solid ${ui.border}`,
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={img.url}
                      sx={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        aspectRatio: "4 / 3",
                      }}
                    />
                    {selectedCompsIds?.includes(img.id) && (
                      <Check
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          bgcolor: ui.blue,
                          color: "white",
                          borderRadius: "50%",
                          p: 0.5,
                        }}
                      />
                    )}
                  </Card>
                ))}
              </Box>
            </Paper>
          </Box>
        </Box>
        {/* ========== RIGHT CHAT PANEL ========== */}
        <Box
          mt={{ xs: 4, md: 0 }}
          display="flex"
          flexDirection="column"
          flex={1}
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
              height: "100%",
            }}
          >
            {/* HEADER */}
            <Box display="flex" gap={1} alignItems="center">
              <AutoAwesome fontSize="small" sx={{ color: "#000" }} />
              <Typography fontWeight={700} letterSpacing={1}>
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
              sx={{
                overflowY: "auto",
                pr: 0.5,
                height: "100%",
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* {loadingOlder && (
                <Box textAlign="center" py={1} color={ui.muted} fontSize={12}>
                  Loading previous messages...
                </Box>
              )} */}
              {messages?.map((msg, index) =>
                msg?.sender === "ai" ? (
                  <Box
                    key={index}
                    display="flex"
                    gap={1}
                    alignItems="flex-start"
                  >
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

                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${ui.border}`,
                        bgcolor: "#F3F5F7",
                        maxWidth: "85%",
                        ...(isGenerating && index === messages.length - 1
                          ? {
                              animation: "pulse 1.2s infinite",
                              opacity: 0.5,
                            }
                          : {}),
                      }}
                    >
                      {msg.text}
                    </Paper>
                  </Box>
                ) : (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: ui.primary,
                      color: "white",
                      alignSelf: "flex-end",
                      maxWidth: "85%",
                    }}
                  >
                    {msg.text}
                  </Paper>
                ),
              )}

              {/* Auto-scroll anchor */}
              <div ref={chatEndRef} />
            </Box>

            <Divider sx={{ my: 2 }} />

         {/* INPUT BAR */}
{/* INPUT BAR */}
<Box
  sx={{
    border: `1px solid ${ui.border}`,
    borderRadius:4,
    backgroundColor: "#F3F5F7",
    px: 2,
    py: 1.6,
    minHeight: 64,
    display: "flex",
    alignItems: "flex-end",
    gap: 1,

  }}
>
  {/* TEXTAREA */}
  <textarea
    value={inputText}
    onChange={(e) => setInputText(e.target.value)}
    placeholder="Direct the AI: 'Change the countertop to marble'..."
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleExecute();
      }
    }}
    rows={3}
    style={{
      flex: 1,
      border: "none",
      background: "transparent",
      outline: "none",
      fontSize: 15,
      lineHeight: "1.6",
      padding: "10px 0",
      color: ui.text,
      resize: "none",
      fontFamily: "inherit",
      overflow: "hidden",
     borderRadius: 0,
    }}
  />

  {/* EXECUTE BUTTON */}
  <Button
    variant="contained"
    onClick={handleExecute}
    sx={{
      bgcolor: ui.primary,
      color: "white",
      borderRadius: 3,
      px: 2.2,
      minHeight: 44,
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

          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
