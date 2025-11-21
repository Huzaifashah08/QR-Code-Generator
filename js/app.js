/* ===========================================================
   PREMIUM QR GENERATOR – by M. Huzaifa
   Smooth, optimized, modern JavaScript for QR generation
   Features:
   ✔ Perfect QR generation (QRious)
   ✔ Center image layering
   ✔ Live (debounced) updates
   ✔ PNG Download
   ✔ WhatsApp / Discord share
   ✔ Clean code architecture + comments
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* --------------------- Element References ---------------------- */
    const urlInput = document.getElementById("urlInput");
    const sizeInput = document.getElementById("sizeInput");
    const sizeOutput = document.getElementById("sizeOutput");
    const fgColor = document.getElementById("fgColor");
    const bgColor = document.getElementById("bgColor");
    const imageInput = document.getElementById("imageInput");
    const canvas = document.getElementById("qrCode");

    /* ------------------------- QR Setup ---------------------------- */
    const qr = new QRious({
        element: canvas,
        value: "",
        size: parseInt(sizeInput.value) || 200,
        background: bgColor.value,
        foreground: fgColor.value,
        level: "H" // Error correction high for center logo
    });

    let centerImageDataUrl = null;

    /* ---------------------- Debounce Helper ------------------------ */
    const debounce = (func, delay = 150) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    /* -------------------- Draw Center Logo --------------------------- */
    const drawCenterImage = () => {
        if (!centerImageDataUrl) return;

        const ctx = canvas.getContext("2d");
        const size = qr.size;
        const img = new Image();

        img.onload = () => {
            const ratio = 0.24;
            const logoSize = Math.floor(size * ratio);
            const x = (size - logoSize) / 2;
            const y = (size - logoSize) / 2;

            // Smooth background to improve scanning
            ctx.save();
            ctx.fillStyle = qr.background;
            createRoundedRect(ctx, x - 8, y - 8, logoSize + 16, logoSize + 16, 16);
            ctx.fill();

            ctx.drawImage(img, x, y, logoSize, logoSize);
            ctx.restore();
        };

        img.src = centerImageDataUrl;
    };

    /* ---------------- Round Rectangle Utility -------------------- */
    const createRoundedRect = (ctx, x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };

    /* -------------------- Core Regeneration ------------------------ */
    const regenerateQR = () => {
        const value = urlInput.value.trim() || "https://";
        const size = Math.min(1024, Math.max(100, parseInt(sizeInput.value) || 200));

        qr.value = value;
        qr.size = size;
        qr.background = bgColor.value;
        qr.foreground = fgColor.value;

        sizeOutput.value = String(size);

        requestAnimationFrame(drawCenterImage);
    };

    const updateQR = debounce(regenerateQR, 160);

    /* ----------------------- Image Input --------------------------- */
    imageInput.addEventListener("change", e => {
        const file = e.target.files[0];

        if (!file) {
            centerImageDataUrl = null;
            regenerateQR();
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Please choose a valid image file.");
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            if (!confirm("Image is larger than 3MB. Continue?")) {
                imageInput.value = "";
                return;
            }
        }

        const reader = new FileReader();
        reader.onload = ev => {
            centerImageDataUrl = ev.target.result;
            regenerateQR();
        };
        reader.readAsDataURL(file);
    });

    /* ------------------------- Live Update Events ------------------- */
    urlInput.addEventListener("input", updateQR);
    sizeInput.addEventListener("input", () => {
        sizeOutput.value = sizeInput.value;
        updateQR();
    });
    fgColor.addEventListener("input", updateQR);
    bgColor.addEventListener("input", updateQR);

    /* ---------------------- Initial Render -------------------------- */
    regenerateQR();

    /* ------------------------- DOWNLOAD PNG ------------------------- */
    window.downloadQR = () => {
        canvas.toBlob(blob => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "qr-code.png";
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 500);
        });
    };

    /* ----------------------- WhatsApp Share ------------------------- */
    window.shareWhatsApp = async () => {
        try {
            const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
            const file = new File([blob], "qr.png", { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    text: "QR code generated with QR Generator by M. Huzaifa"
                });
                return;
            }
        } catch (err) {}

        const msg = encodeURIComponent("Generated a QR code! Download it or attach manually.");
        window.open(`https://web.whatsapp.com/send?text=${msg}`, "_blank");
    };

    /* ------------------------ Discord Share ------------------------- */
    window.shareDiscord = async () => {
        try {
            const blob = await new Promise(res => canvas.toBlob(res, "image/png"));

            if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob })
                ]);

                alert("QR copied! Go to Discord and paste it (CTRL+V).");
                return;
            }
        } catch (err) {
            console.warn("Clipboard not supported:", err);
        }

        if (confirm("Clipboard image copy not supported. Download instead?")) {
            downloadQR();
        }
    };

    /* ------------------ Compatibility for inline HTML ---------------- */
    window.generateQR = updateQR;
});
