# Rows Missing from MySQL (Present in PostgreSQL)

**Date:** August 14, 2025  
**Analysis:** Tables where PostgreSQL has more data than WordPress MySQL

---

## Summary

This report identifies records that exist in PostgreSQL but are missing from the WordPress MySQL container. This suggests that PostgreSQL contains more complete or up-to-date data.


## Overall Statistics

- **Total extra records in PostgreSQL**: 9,699
- **Tables with discrepancies**: 5
- **Analysis date**: August 14, 2025

---

## Detailed Analysis


### ak_mangas

- **MySQL records**: 9,979
- **PostgreSQL records**: 19,670
- **Missing from MySQL**: 9,691 records
- **MySQL ID range**: 1	9990
- **PostgreSQL ID range**: 1 | 19681

**Example IDs missing from MySQL**:
- ID: 19681
- ID: 19680
- ID: 19679
- ID: 19678
- ID: 19677


### ak_animes

- **MySQL records**: 8,117
- **PostgreSQL records**: 8,118
- **Missing from MySQL**: 1 records
- **MySQL ID range**: 1	8141
- **PostgreSQL ID range**: 1 | 8142


### ak_business_to_mangas

- **MySQL records**: 17,899
- **PostgreSQL records**: 17,900
- **Missing from MySQL**: 1 records
- **MySQL ID range**: Unknown
- **PostgreSQL ID range**: Unknown


### ak_tag2fiche

- **MySQL records**: 99,205
- **PostgreSQL records**: 99,208
- **Missing from MySQL**: 3 records
- **MySQL ID range**: Unknown
- **PostgreSQL ID range**: 1 | 99214


### ak_page_404

- **MySQL records**: 79,582
- **PostgreSQL records**: 79,585
- **Missing from MySQL**: 3 records
- **MySQL ID range**: 14	79595
- **PostgreSQL ID range**: 0 | 79595


---

## Key Findings

1. **ak_mangas**: PostgreSQL contains significantly more manga records than MySQL
2. **Enhanced data**: PostgreSQL appears to have more complete dataset
3. **Data source**: PostgreSQL may have been updated more recently
4. **Recommendation**: PostgreSQL should be considered the authoritative data source

## Technical Notes

- Analysis performed using direct COUNT(*) queries
- ID ranges indicate PostgreSQL has newer/additional records
- Missing examples show specific records not present in MySQL
- This suggests PostgreSQL has been receiving updates not reflected in MySQL

---

*Report generated automatically on August 14, 2025*
