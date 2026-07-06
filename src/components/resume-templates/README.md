# ResumeLens Design Templates Architecture

This directory contains the visual layouts for ResumeLens. To support various platforms and workflows (live web manipulation vs. downloadable document compilation), layout rendering is divided into three parallel systems, coordinated by a central set of **Design Tokens**.

---

## 1. The Three Rendering Contexts

| Context | Location | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **Live Editor Preview** | `src/components/resume-templates/` | Standard React components (HTML/inline CSS) | Renders the candidate's actual **resume text** side-by-side inside the interactive text editor workspace. |
| **Visual Report Mock** | `src/components/pdf-templates/` | Standard React components (HTML/CSS Modules) | Renders a styled mock preview of the **resume review scorecard report** in the Results panel. |
| **PDF Document Compilation** | `src/lib/pdf/` | `@react-pdf/renderer` primitive components | Generates the actual binary PDF files on download. Includes separate PDF generators for the **resume** (`*PdfTemplate.tsx`) and the **scorecard report** (`ResumeReviewPdfTemplate.tsx`). |

---

## 2. Design Tokens Source of Truth

To prevent these templates from drifting in design properties (colors, typography, font-sizes, margins), all visual properties are centralized at:

📌 **[`src/lib/designTokens.ts`](file:///c:/Users/LENOVO/Documents/resumelens/src/lib/designTokens.ts)**

These tokens organize the style settings for the 5 official designs:
*   **Professional**: Serif Lora formatting, deep corporate blue (`#1e3a8a`), formal padding/margins.
*   **Modern**: Clean Inter sans-serif font family, sleek slate color (`#0f172a`), split sidebar/main columns.
*   **Minimal**: Ultra-clean Helvetica layout, dark charcoal text, spacious structure.
*   **Creative**: Elegant Montserrat typography, burnt orange header border (`#c2410c`), off-white background block.
*   **Executive**: High-end Times Roman formatting, formal margin structure.

---

## 3. Template Selection & Naming Conventions

Across all layouts, the active design ID maps consistently:
*   In the **Resume Editor**, templates are named: `professional`, `modern`, `minimal`, `creative`, `executive`.
*   In the **Results Panel (Review Scorecard)**, the first design is labeled **Professional Template** (corresponds to `professional`). For backward compatibility, `"classic"` is supported as a fallback alias matching `professional`.
