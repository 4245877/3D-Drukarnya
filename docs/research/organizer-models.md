# Honeycomb Storage Wall and Rugged Desktop Organizer

Research date: 2026-10-04 (Europe/Kyiv). These records distinguish live source metadata, digitally inspected STL dimensions and physical production checks still to be performed.

## Method and evidence

- The original public Printables HTML pages returned Cloudflare challenge pages, and browser surfaces were unavailable.
- Current metadata was obtained directly from the public `https://api.printables.com/graphql/` endpoint with `print(id: ...)`: model title, complete description, author, licence, image paths and file list. UTF-8 JSON without a BOM was required. This succeeded for both models.
- Both models also returned `excludeCommercialUsage: false`. For HSW that flag does not override its CC BY-NC restriction; for SHQ no separate commercial-use exclusion was observed.
- Actual public download URLs were obtained with `getDownloadLink(id: ..., printId: ..., fileType: stl, source: model_detail)` and the selected files were downloaded from `files.printables.com`. No download path was guessed from a preview.
- Binary STL vertex bounds were calculated with Python `struct`. Each selected file has one vertex-connected component. These are dimensions of the digital geometry, not measurements of a finished print. Mass, print time, assembly fit and strength were not inferred from these files.
- All 28 HSW gallery images and all five SHQ images were downloaded successfully and decoded; contact sheets were inspected. Their existence is not evidence of permission for commercial reuse.
- RostaP's author-exported [HSW documentation PDF](https://media.printables.com/media/prints/152592/pdfs/152592-honeycomb-storage-wall-7c3ddd75-ab96-4c17-9895-74008e6a8880.pdf) was also read and relevant pages rendered. It is dated 2023-08-12, so current licence and filenames were cross-checked with the live API rather than treated as current solely from that export. The current description and licence agree with the export.

## P48: Honeycomb Storage Wall, 849 UAH provisional

Author: RostaP, handle `RostaP`. [Original model](https://www.printables.com/model/152592-honeycomb-storage-wall). Current API licence: `Creative Commons — Attribution — Noncommercial`; PDF identifies [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Selling printed parts needs a separate commercial licence from RostaP. No such permission was supplied or discovered.

The store's fixed starter selection consists only of original files available on that exact page, with no remix accessories:

| Printed component | Exact live filename | File ID | Quantity | STL bounds, mm |
| --- | --- | --- | ---: | --- |
| Panel, K1-sized version | `wall-honeycomb-k1-211x201.stl` | 2263361 | 2 | 211.1931 × 200.6000 × 8.0000 |
| Double hollow connector | `insert-hollow-dual.stl` | 628234 | 2 | 46.4190 × 34.3000 × 10.0000 |
| Wall mounting insert | `Insert-countersunk.stl` | 628163 | 4 | 25.9808 × 22.5000 × 10.0000 |
| Empty hook insert | `insert-empty.stl` | 628235 | 4 | 25.9808 × 22.5000 × 10.0000 |
| Short hook | `hook-to-empty.stl` | 629313 | 2 | 15.6116 × 37.4537 × 21.7443 |
| Long hook | `hook-to-empty-long.stl` | 629323 | 2 | 17.8493 × 89.4449 × 22.7843 |

Total: **16 individually printed components from six distinct STL files**. Four suitable wall screws with countersunk heads and substrate-appropriate wall anchors are required and excluded. The exact screw-head diameter, screw length, substrate fixing, connector layout and safe load are pending prototype checks. No M3 or M4 accessory bolts/nuts are needed for the selected push-in hook pack; threaded hooks, shelves, boxes, keyboard brackets and nut inserts were deliberately not selected. The assembled wall size is not claimed from simply adding two panel bounds.

Direct author file sources, confirmed by the download API:

- [Panel STL](https://files.printables.com/media/prints/152592/stls/4280716_c110e71d-dc77-46a4-8af7-b576d58805e7/wall-honeycomb-k1-211x201.stl)
- [Double hollow connector STL](https://files.printables.com/media/prints/152592/stls/1435356_62b4d148-0d54-41e7-8867-73cfcaedbcfb/insert-hollow-dual.stl)
- [Wall insert STL](https://files.printables.com/media/prints/152592/stls/1435190_2775b416-ec2d-4038-b664-ca9b936ffb4d/insert-countersunk.stl)
- [Empty insert STL](https://files.printables.com/media/prints/152592/stls/1435358_2ce60d36-cc57-4ab7-ab63-12db1ccead09/insert-empty.stl)
- [Short hook STL](https://files.printables.com/media/prints/152592/stls/1438030_d6d8543d-68d9-43e0-b292-08abf3b9703e/hook-to-empty.stl)
- [Long hook STL](https://files.printables.com/media/prints/152592/stls/1438059_b5ba8f54-277d-4a7a-aa63-689f7240bfa2/hook-to-empty-long.stl)

Original page has STL, STEP and an F3D source file; none of the live `stls` entries is 3MF. The author also supplies a PET G-code for the smaller original panel, which is not the selected two-panel kit and its 58 g / 3h53m figures are not used as kit measurements. Author panel guidance: layer 0.25–0.30 mm, at least three perimeters. Inserts: layer 0.20 mm, four perimeters, 20% infill. PETG for the complete starter set is the shop's proposed material, to validate with trial printing; it is not claimed as an already tested production setup. Author installation diagram specifies thicker side outward and a hexagon edge horizontal.

Draft gallery is prepared with the same existing `images` URL-array mechanism: first image is the cover, followed by details. Selected URLs all downloaded and decoded:

1. [Landscape overview](https://media.printables.com/media/prints/152592/images/1437091_178c2ccc-772f-4325-803a-55d0246727a6/resize_img_5743.jpg), 2016 × 1512. Shows an expanded author wall with many accessories, keyboards and electronics. The draft notice explicitly excludes all those unlisted items.
2. [Countersunk wall-insert detail](https://media.printables.com/media/prints/152592/images/1435724_8ff0e071-e88d-4e72-bf0e-6631b83fa336/resize_img_5596.jpg), 1512 × 2016.
3. [Empty inserts](https://media.printables.com/media/prints/152592/images/1435746_fb919f13-13ec-4ae3-a780-a15fbf467511/resize_img_5646.jpg), 833436 bytes, 1512 × 2016.

The overview is a demonstration, not a photograph of the proposed fixed set. Missing before publication: own or specifically authorised cover showing exactly the two selected panels and all 14 companion parts; an assembled photo with four selected hooks; detail photos of connectors and fits. No separate author-photo licence or permission was found. `photoRightsStatus: review_required`; `publicationStatus: draft`, `publishOffer: false`, no order link, availability unconfirmed.

## P49: SHQ Rugged Desktop Organizer, 899 UAH provisional

Author: SHQ, handle `StoererHauptquartier`. [Exact original model](https://www.printables.com/model/503156-rugged-desktop-organizer). Current API licence: `Creative Commons — Attribution`, matching page's [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Commercial manufacture is permitted with attribution. This does not independently prove that the photographs or renderings are licensed for the shop's use.

Current downloadable files:

| Exact filename | File ID | Size |
| --- | --- | ---: |
| `DesktopOrganizer.stl` | 2157706 | 1,510,384 bytes |
| `DesktopOrganizer.step` | 2157707 | 992,361 bytes |
| `DesktopOrganizer.sldprt` | 2157708 | 768,190 bytes |

No 3MF or author G-code/profile was listed. Selection: **one complete full-size printed `DesktopOrganizer.stl`**, one connected component, 30,206 triangles. [Downloaded STL](https://files.printables.com/media/prints/503156/stls/4087598_418e082c-251d-47b4-816e-54aceea42a22/desktoporganizer.stl). Digital XYZ bounds are exactly **175 × 90 × 100 mm**. No screws, inserts or separate base are included or called for by this selected one-body version. The smaller [author version №1335600](https://www.printables.com/model/1335600-rugged-desktop-organizer-small-version) is a different product and is excluded.

Author description identifies pen/pencil, USB-stick and SD-card storage and mentions 90 × 90 mm Post-its. The card records that as the author's compatibility claim awaiting a trial fit, because outer width is only 90 mm and the recess has not been measured physically. Exact slot count/dimensions, mass and print time are not invented. Author text does not specify material, layer, infill, supports or print orientation; shop PLA is proposed for desk use and requires trial-print validation. No electronics, flash drives, cards, stationery or paper is supplied.

Important identity distinction: the similarly named **Byzantium3D** model on Thingiverse/Cults, with two top/bottom pieces and 92 × 88 × 85 mm dimensions, is unrelated. Its filenames, properties, licence and photos were not imported into this SHQ product.

All five original SHQ image URLs are 800 × 600 and downloaded successfully. Visual inspection shows they are renderings of the exact same full-size one-body geometry, not real printed-product photographs. Gallery order preserves the author cover, alternate angle, side, back and top:

1. [Cover/front angle](https://media.printables.com/media/prints/503156/images/4087610_41a71705-4f87-4369-a1cf-7926514d1866/desktop-organizer2.jpg)
2. [Opposite angle](https://media.printables.com/media/prints/503156/images/4087607_e8d9eaca-18d4-444c-974b-a90570ea548c/desktop-organizer1.jpg)
3. [Side](https://media.printables.com/media/prints/503156/images/4087609_f047c451-56bf-4e36-8d37-3b850c3ffd54/desktop-organizer4.jpg)
4. [Back](https://media.printables.com/media/prints/503156/images/4087608_d9fa49b4-90b9-40c5-b50b-32791ad2b54f/desktop-organizer3.jpg)
5. [Top](https://media.printables.com/media/prints/503156/images/4087606_3c22df76-601f-4707-85d9-64d305097fb5/desktop-organizer5.jpg)

`imageNotice` says renderings, not photos. Missing before publication: own/authorised finished-product cover, alternate angle and top/detail showing actual printed fits, plus explicit permission if retaining author's renderings. Status is draft for photography and production checks, while commercial model rights are attribution-required rather than permission-required.

## Catalogue implementation limits

Both products remain in the existing `Аксесуари для стійок` category as requested; neither description claims mechanical compatibility with a 10-inch or 19-inch rack. Prices 849 and 899 UAH are preliminary user-supplied shop targets, retained as `priceType: from` with clear provisional notes. Neither has fabricated `weightGrams` or `pricingProfile`. Root-agent integration owns site/data validation, production exclusion of drafts, responsive gallery QA and build checks.
