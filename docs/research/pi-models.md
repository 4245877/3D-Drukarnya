# Raspberry Pi models: source and production review

Checked 2026-10-04. All four products are retained as private production drafts. Source licensing and production validation are independent of image permissions.

## Evidence and method

The public author pages are the citations below. Direct HTML reads were blocked by Cloudflare, but the public Printables GraphQL endpoint returned current author, license, description, original gallery paths, and exact file names. The source records are saved in [pi-source-metadata.json](pi-source-metadata.json). Query shape: `{ print(id:"642650") { id name description license { name } user { publicUsername handle } images { filePath } stls { name filePreviewPath } } }`.

Selected STL identifiers were retrieved separately. Public download links were obtained through the platform's `getDownloadLink` operation, and all selected binary STL downloads succeeded. Mesh triangle counts and bounding boxes are in [pi-stl-dimensions.json](pi-stl-dimensions.json). **STL is unitless: these are file-coordinate envelopes, not verified millimetre dimensions of assembled printed products.** The cards deliberately omit assembled dimensions, measured mass, and print time until production checks are complete.

Image URLs were confirmed against the primary API, downloaded into a temporary research directory with HTTP 200, decoded, and visually inspected. Files remain remote `images[]` references, matching the existing catalog mechanism; first entry is cover, remaining entries are gallery. Original photos are not published by a production build while the entries remain drafts.

No reviewed author description supplies separate permission to use photography/renders commercially. `photoRightsStatus: review_required` is therefore used for every entry. The model's CC license is not treated as proof of rights to the author's photography.

## P40 — Raspberry Pi 5 snap-fit, 329 UAH starting reference

[Author model](https://www.printables.com/model/642650-raspberry-pi-5-case-snap-fit), [files](https://www.printables.com/model/642650-raspberry-pi-5-case-snap-fit/files).

- Author: **pyrho // 25.wf**, handle `pyrho`. Primary current license: **CC BY-SA 4.0**; commercial fabrication allowed subject to attribution and applicable ShareAlike conditions for adaptations. Page updated 2024-06-11; description changelog latest v3.1.1.
- Fixed configuration: current **v3** file group, `bottom.stl` (2830286) ×1 plus `top_full.stl` (2830285) ×1. Two printed parts, no closure screws. Old v1/v2 files excluded.
- Compatibility: Raspberry Pi 5; geometry made for official **Active Cooler**. Intake at blower, rear exhaust, LED opening and recessed power-button access. Selected full-opening lid includes GPIO/ribbon openings; checked against the source STL preview. This product is not the Pimoroni NVMe Base variant.
- Author printed Prusament PLA, 0.4 mm nozzle, 0.2 mm layer height; flat side on bed. Draft material is PLA. None of the author's thermal results is presented as this shop's thermal validation.
- Available current STL + historical STL and F3D sources; no verified 3MF located.
- Supply: only two printed halves. Raspberry Pi 5, Active Cooler, microSD, power supply and cables excluded.
- Gallery selection: source indices **0, 3, 4, 2** (`dsc_0100.jpg`, `dsc_0101.jpg`, `dsc_0102.jpg`, `dsc_0099.jpg`). Closed cover, port views, then open assembly. Original images are roughly 6016 × 4000, ratio ~1.50. Electronics are explicitly excluded in `imageNotice`.
- Remaining: image permission; test print and clip durability; Pi/cooler/port/FFC/airflow fit; assembled dimensions, weight and price recalculation.

## P41 — Raspberry Pi 5 + Pimoroni NVMe Base, 499 UAH starting reference

[Author model](https://www.printables.com/model/909805-case-for-raspberry-pi-5-with-pimoroni-nvme-base-op).

- Author: **pyrho // 25.wf**. Primary current license: **CC BY-NC-SA 4.0**; separate commercial permission required. This is narrower than the original P40 model's CC BY-SA license. Page updated 2024-06-17.
- Fixed configuration: **Simple**, `bottom_nomount.stl` (3823657) ×1 + `top.stl` (3823660) ×1. Two halves, no external mounting plate. The two `top.stl` source IDs 3823658 and 3823660 were downloaded and are byte-identical: SHA-256 `2DADF3DA753DFB5FA3D2BED7928E014BAE74343C618E7B2578E034391CDFC1F2`.
- Compatibility is specifically **Pimoroni NVMe Base**, not Duo, generic NVMe HAT, or another vendor's board. Description calls the Simple case green and Mounted case orange. Mounted would add `bottom_mounted.stl` + `mount.stl` and taper 3×6 screws for a surface; that configuration is excluded here.
- Source gallery depicts Active Cooler; compatibility follows the author's related base case and must still be verified with the Pi + Base + PCIe FFC. GPIO access, exact SSD/heatsink clearance, microSD/button/port access and standoff stack need a real assembly check.
- Author does not state separate material/settings for this remix. PETG is **our provisional manufacturing choice**, not an author-confirmed material. STL + `slimcase2_pimo v6.f3d`; no verified 3MF located.
- Supply: two Simple printed halves. Pi, Pimoroni NVMe Base, SSD, Active Cooler, PCIe FFC, microSD, power supply, board screws and spacers excluded.
- Gallery selection: green **Simple only**, indices **0, 4, 5, 6, 2** (`dsc_0298`, `dsc_0299`, `dsc_0300`, `dsc_0301`, `dsc_0297`), all JPEG. Each 6016 × 4000. Orange Mounted images were deliberately excluded.
- Remaining: commercial permission; image permission; real assembly with exact Base; dimensions, weight and production price.

## P42 — Raspberry Pi Zero 2 W with GPIO/heatsink opening + ears, 199 UAH starting reference

[Author model](https://www.printables.com/model/605642-raspberry-pi-zero-2w-case-with-heat-sink-and-gpio-), [files](https://www.printables.com/model/605642-raspberry-pi-zero-2w-case-with-heat-sink-and-gpio-/files).

- Author: **tn00364361**, handle `tn00364361_495827`. Primary license: **CC BY 4.0**, attribution required, commercial fabrication allowed. Page updated 2023-10-22.
- Fixed configuration: `Pi Zero 2W Case - top.stl` (2584392) ×1 + `Pi Zero 2W Case - bottom with ears.stl` (2584397) ×1. Two printed parts. Plain bottom excluded. Source preview confirms **two mounting ears**.
- Primary description confirms assembly with **four M2.5×8 screws**; ribs stiffen 0.4 mm top/bottom skins. Author profile: 0.8 mm wall, two lines at 0.4 mm, 0.2 mm layers. Material unspecified; PETG is our provisional choice.
- Lid has GPIO and heatsink cutouts. Exact heatsink dimensions, GPIO/header height, HAT compatibility, camera cable path and mounting-hole centres are not specified. No fan seat claimed. Other Zero boards are not automatically declared compatible.
- Three STL variants available; no verified 3MF located.
- Supply: lid and ear-bottom only; four assembly screws, surface fasteners, Pi, heatsink and cables excluded.
- **Photo gap:** all four author photographs show the **plain no-ear bottom**, so they would misrepresent this fixed SKU. The draft uses only exact selected STL preview URLs (ear-bottom cover, lid second) and clearly labels them as previews. These are usable technical references, not photographs of a printed product. Need a real cover and several assembly/detail photos of the version with ears, plus image rights.
- Remaining: photos and permissions; print/assembly/ear-strength test; screw fit; real board, heatsink and GPIO check; dimensions/weight/production price.

## P44 — Malolo Raspberry Pi 4 Model B snap-fit, 329 UAH starting reference

[Author model](https://www.printables.com/model/4074-malolos-screw-less-snap-fit-raspberry-pi-4-model-b), [original author export PDF](https://media.printables.com/media/prints/4074/pdfs/4074-malolos-screw-less-snap-fit-raspberry-pi-4-model-b-case-stands-fa9dc035-e6b2-42b1-899b-30c01c9954d6.pdf).

- Author: **Malolo**. Primary current license and author PDF agree: **CC BY-NC 4.0**, **without ShareAlike**. Separate commercial permission required. Page updated 2022-12-28.
- Fixed configuration: `Top_Slots_SM.stl` (508872) ×1 + `Bottom_Slots_SM.stl` (508912) ×1. Two single-material ventilated halves. Closure requires no screws/glue.
- Ready-made chosen STL files have **no GPIO/camera/display accessory slots**. The author offers SCAD customization for them. No dedicated fan mount in this SKU. Other source options include 30/40 mm fan rails/sled or screw holes; author specifically tested 30 mm PI-FAN and 40 mm Noctua NF-A4x10 in the corresponding fan variants. Those claims are not applied to our standard Slots SM set.
- PETG recommended by author. Their 0.1/0.2 mm layer trials were on Pi 3 case, not this shop's Pi 4 validation. Source says Haz1 printed iterations to help verify Pi 4 fit; it does not establish local production readiness.
- STL selected pair, many optional STL assets, SCAD scripts and base STEP available. No verified selected 3MF located.
- Supply: two Slots SM halves only; Pi 4, heatsink, cooler, HAT, microSD, cables and all stands/sleds excluded.
- **Photo gap:** author explicitly states gallery images are renders. Draft cover is the matching `slots_sm.jpg`, followed by exact `Top_Slots_SM` and `Bottom_Slots_SM` source previews. A real printed Slots SM cover plus additional photos are still needed; no Pi 3 images were reused.
- Remaining: commercial/image permission; printed-product photos; Pi 4 assembly, snaps, port and airflow testing; dimensions, weight and final price.

## Data validation

Created `product-40.json`, `product-41.json`, `product-42.json`, `product-44.json` in the existing products directory with Ukrainian copy and original image-reference mechanism. All four passed the project's `productSchema.safeParse`. Drafts have `availability: unconfirmed`, `publishOffer: false`, no order URL and no invented weight/pricing profile. Prices above are the user's initial references, not manufactured mass-derived prices. Site build/category/search/mobile validation is handled by the parent integration task.
