<#
.SYNOPSIS
HL7 message search and investigation tool for production environments.

.DESCRIPTION
Scans folders containing .hl7 files and searches for specific messages.
Supports files with multiple HL7 messages and handles various file formats.

Search by:
 - PID-3 (Patient Identifier)
 - PV1-19 (Visit Number)
 - PV1-3 (Assigned Patient Location)

Features:
 - Multi-message file support
 - Robust message splitting
 - Component extraction from composite fields
 - Optional full message display
 - Performance monitoring and statistics
 - Error handling with detailed logging

.PARAMETER FolderPath
Path to folder containing HL7 files. Required. Supports recursive search.

.PARAMETER PID
Patient Identifier (PID-3). Searches the first component of the identifier.
Partial matches supported using wildcards.

.PARAMETER Visit
Visit Number (PV1-19). Searches the entire field value.
Partial matches supported using wildcards.

.PARAMETER Location
Assigned Patient Location (PV1-3). Searches the entire field value.
Partial matches supported using wildcards.

.PARAMETER ShowFullMessage
Optional switch to display the complete HL7 message when a match is found.
Useful for detailed investigation and debugging.

.EXAMPLE
.\Search-HL7Message.ps1 -FolderPath "C:\HL7Files" -PID "12345"
Searches for messages with Patient ID containing "12345"

.EXAMPLE
.\Search-HL7Message.ps1 -FolderPath "C:\HL7Files" -Visit "V2024001" -ShowFullMessage
Searches for visit number and displays full HL7 messages

.EXAMPLE
.\Search-HL7Message.ps1 -FolderPath "C:\HL7Files" -PID "12345" -Location "ICU"
Searches for patient ID "12345" in ICU location (combined criteria)

.NOTES
Author: Healthcare IT Team
Version: 2.0
Last Updated: 2025-02-17

Requirements:
- PowerShell 5.1 or higher
- Read access to HL7 file directory
- HL7 files with .hl7 extension

#>

[CmdletBinding()]
param (
    [Parameter(Mandatory=$true, HelpMessage="Path to folder containing HL7 files")]
    [ValidateScript({
        if (!(Test-Path $_)) {
            throw "Folder path does not exist: $_"
        }
        return $true
    })]
    [string]$FolderPath,

    [Parameter(Mandatory=$false, HelpMessage="Patient Identifier (PID-3)")]
    [string]$PID = $null,

    [Parameter(Mandatory=$false, HelpMessage="Visit Number (PV1-19)")]
    [string]$Visit = $null,

    [Parameter(Mandatory=$false, HelpMessage="Assigned Patient Location (PV1-3)")]
    [string]$Location = $null,

    [Parameter(Mandatory=$false, HelpMessage="Display full HL7 message for matches")]
    [switch]$ShowFullMessage
)

# ============================================
# CONFIGURATION
# ============================================
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"  # Suppress progress bars for performance

# ============================================
# INITIALIZE COUNTERS
# ============================================
$matchCount = 0
$fileCount = 0
$messageCount = 0
$errorCount = 0
$startTime = Get-Date

# ============================================
# VALIDATE SEARCH CRITERIA
# ============================================
if ([string]::IsNullOrWhiteSpace($PID) -and 
    [string]::IsNullOrWhiteSpace($Visit) -and 
    [string]::IsNullOrWhiteSpace($Location)) {
    Write-Host "ERROR: At least one search criterion must be provided." -ForegroundColor Red
    Write-Host "Use -PID, -Visit, or -Location parameters." -ForegroundColor Yellow
    Write-Host "Run 'Get-Help .\Search-HL7Message.ps1 -Examples' for usage examples." -ForegroundColor Cyan
    return
}

# ============================================
# DISPLAY SEARCH PARAMETERS
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       HL7 MESSAGE SEARCH TOOL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Search Folder: $FolderPath"
Write-Host "Search Criteria:" -ForegroundColor Yellow
if ($PID) { Write-Host "  - Patient ID (PID-3): $PID" }
if ($Visit) { Write-Host "  - Visit Number (PV1-19): $Visit" }
if ($Location) { Write-Host "  - Location (PV1-3): $Location" }
Write-Host "Show Full Messages: $ShowFullMessage"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# MAIN PROCESSING LOOP
# ============================================
Write-Host "Scanning files..." -ForegroundColor Yellow
Write-Host ""

try {
    Get-ChildItem -Path $FolderPath -Filter *.hl7 -Recurse -ErrorAction Stop | ForEach-Object {
        
        $fileCount++
        $filePath = $_.FullName
        
        try {
            # Read file content as raw text
            $content = Get-Content $filePath -Raw -ErrorAction Stop
            
            if ([string]::IsNullOrWhiteSpace($content)) { 
                Write-Verbose "Empty file: $filePath"
                return 
            }
            
            # ============================================
            # IMPROVED MESSAGE SPLITTING
            # Split on MSH segment at start of line
            # Filter out empty strings and whitespace
            # ============================================
            $messages = ($content -split "(?m)^(?=MSH\|)") | Where-Object { 
                $_.Trim() -ne "" -and $_ -match '\S' 
            }
            
            foreach ($msg in $messages) {
                
                if ([string]::IsNullOrWhiteSpace($msg)) { continue }
                
                $messageCount++
                
                # ============================================
                # INITIALIZE MESSAGE VARIABLES
                # ============================================
                $pid3 = $null
                $pid3Display = $null
                $visitNum = $null
                $loc = $null
                $msh10 = $null
                $fieldDelimiter = "|"  # Default delimiter
                
                # ============================================
                # PARSE MESSAGE LINE BY LINE
                # ============================================
                $lines = $msg -split "`r?`n"
                
                foreach ($line in $lines) {
                    
                    # Skip empty lines
                    if ([string]::IsNullOrWhiteSpace($line)) { continue }
                    
                    # ============================================
                    # MSH SEGMENT - Extract Control ID and Delimiter
                    # ============================================
                    if ($line.StartsWith("MSH")) {
                        # Extract custom delimiter from MSH-1 (position 3)
                        if ($line.Length -gt 3) {
                            $fieldDelimiter = $line[3]
                        }
                        
                        $fields = $line.Split($fieldDelimiter)
                        if ($fields.Count -gt 9) { 
                            $msh10 = $fields[9].Trim()
                        }
                    }
                    
                    # ============================================
                    # PID SEGMENT - Extract Patient Identifier
                    # HL7 PID-3 format: ID^Type^System
                    # We extract the first component (ID)
                    # ============================================
                    if ($line.StartsWith("PID")) {
                        $fields = $line.Split($fieldDelimiter)
                        if ($fields.Count -gt 3) { 
                            $pid3 = $fields[3].Trim()
                            
                            # Extract first component (before ^)
                            if ($pid3 -match '^([^^]+)') {
                                $pid3Display = $matches[1]
                            } else {
                                $pid3Display = $pid3
                            }
                        }
                    }
                    
                    # ============================================
                    # PV1 SEGMENT - Extract Location and Visit Number
                    # ============================================
                    if ($line.StartsWith("PV1")) {
                        $fields = $line.Split($fieldDelimiter)
                        
                        # PV1-3: Assigned Patient Location
                        if ($fields.Count -gt 3) { 
                            $loc = $fields[3].Trim()
                        }
                        
                        # PV1-19: Visit Number
                        if ($fields.Count -gt 19) { 
                            $visitNum = $fields[19].Trim()
                        }
                    }
                }
                
                # ============================================
                # APPLY SEARCH FILTERS
                # Each criterion is optional
                # All provided criteria must match
                # ============================================
                $pidMatch = (!$PID -or ($pid3Display -like "*$PID*"))
                $visitMatch = (!$Visit -or ($visitNum -like "*$Visit*"))
                $locMatch = (!$Location -or ($loc -like "*$Location*"))
                
                if ($pidMatch -and $visitMatch -and $locMatch) {
                    
                    $matchCount++
                    
                    # ============================================
                    # DISPLAY MATCH RESULTS
                    # ============================================
                    Write-Host ""
                    Write-Host "█████ MATCH FOUND █████" -ForegroundColor Green
                    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
                    Write-Host "File Path:        " -NoNewline; Write-Host $filePath -ForegroundColor White
                    Write-Host "Message ID:       " -NoNewline; Write-Host $msh10 -ForegroundColor White
                    Write-Host "Patient ID:       " -NoNewline; Write-Host $pid3Display -ForegroundColor Cyan
                    Write-Host "  Full PID-3:     " -NoNewline; Write-Host $pid3 -ForegroundColor Gray
                    Write-Host "Visit Number:     " -NoNewline; Write-Host $visitNum -ForegroundColor Cyan
                    Write-Host "Location:         " -NoNewline; Write-Host $loc -ForegroundColor Cyan
                    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
                    
                    # ============================================
                    # OPTIONAL FULL MESSAGE DISPLAY
                    # ============================================
                    if ($ShowFullMessage) {
                        Write-Host ""
                        Write-Host "┌─────────────────────────────────────┐" -ForegroundColor Cyan
                        Write-Host "│     FULL HL7 MESSAGE CONTENT        │" -ForegroundColor Cyan
                        Write-Host "└─────────────────────────────────────┘" -ForegroundColor Cyan
                        Write-Host $msg -ForegroundColor Gray
                        Write-Host "┌─────────────────────────────────────┐" -ForegroundColor Cyan
                        Write-Host "│         END OF MESSAGE              │" -ForegroundColor Cyan
                        Write-Host "└─────────────────────────────────────┘" -ForegroundColor Cyan
                    }
                }
            }
            
        } catch {
            $errorCount++
            Write-Warning "Error processing file: $filePath"
            Write-Warning "Error details: $($_.Exception.Message)"
        }
    }
    
} catch {
    Write-Host ""
    Write-Host "CRITICAL ERROR: Unable to scan directory" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    return
}

# ============================================
# CALCULATE PERFORMANCE METRICS
# ============================================
$endTime = Get-Date
$duration = $endTime - $startTime
$durationSeconds = [math]::Round($duration.TotalSeconds, 2)

# ============================================
# DISPLAY FINAL SUMMARY
# ============================================
Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor White
Write-Host "║       SEARCH SUMMARY REPORT            ║" -ForegroundColor White
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor White
Write-Host ""
Write-Host "Search Folder:       $FolderPath"
Write-Host "Files Scanned:       $fileCount" -ForegroundColor Cyan
Write-Host "Messages Scanned:    $messageCount" -ForegroundColor Cyan
Write-Host "Matches Found:       " -NoNewline
if ($matchCount -gt 0) {
    Write-Host $matchCount -ForegroundColor Green
} else {
    Write-Host $matchCount -ForegroundColor Yellow
}
Write-Host "Errors Encountered:  $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Gray" })
Write-Host "Execution Time:      $durationSeconds seconds" -ForegroundColor Gray
Write-Host ""

if ($matchCount -eq 0) {
    Write-Host "⚠ No matching HL7 messages found." -ForegroundColor Yellow
    Write-Host "Suggestions:" -ForegroundColor Cyan
    Write-Host "  • Verify search criteria are correct"
    Write-Host "  • Check if files contain the expected data"
    Write-Host "  • Try broadening search terms"
} else {
    Write-Host "✓ Search completed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor White
