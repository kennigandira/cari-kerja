# LaTeX CV Compilation Guide

## Master CV Location
`03_CV_Templates/master_cv.tex`

## How to Compile

### Option 1: Command Line
```bash
pdflatex master_cv.tex
```

### Option 2: Online (Overleaf)
1. Go to overleaf.com
2. Upload master_cv.tex
3. Compile and download PDF

### Option 3: Local LaTeX Editor
- TeXShop (Mac)
- TeXworks (Windows)
- VS Code with LaTeX extension

## Required Packages
- roboto font
- xcolor
- hyperref
- tabularx

## Customization Tips

### For Different Positions
1. **Web3/Blockchain**: 
   - Add Web3 projects section
   - Emphasize TypeScript, performance metrics
   
2. **US Remote**:
   - Add timezone availability
   - Emphasize async communication
   
3. **Bangkok Local**:
   - Keep Thailand phone number prominent
   - Add work permit status if relevant

### Quick Edits
- **Contact**: Line 91-93
- **Experience**: Start from line 98
- **Skills**: Line 155-158
- **Awards**: Line 163-166

## Output
Save compiled PDF to: `01_Profile/current_cv/`