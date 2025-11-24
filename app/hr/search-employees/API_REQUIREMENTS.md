# Employee Search API Requirements

## Endpoint
`GET /employees/search`

## Query Parameters

### Search Parameters
- `search_type` (string, optional): Type of search
  - Values: `"empid"`, `"name"`, `"department"`, `"location"`
- `search_value` (string, optional): The search term/value
  - For `empid`: Employee ID to search
  - For `name`: Employee name to search (fuzzy search)
  - For `department`: Department ID
  - For `location`: Location ID
- `fuzzy` (boolean, optional): Enable fuzzy search (default: `true`)
  - When `true`, performs fuzzy matching for name and empid searches
- `name_starts_with` (string, optional): Filter employees by name starting with a specific letter (A-Z)
  - Only used when `search_type` is `"name"` or not specified
  - Example: `name_starts_with=A` will return all employees whose name starts with "A"

## Request Examples

### Search by Name (Fuzzy)
```
GET /employees/search?search_type=name&search_value=john&fuzzy=true
```

### Search by Employee ID (Fuzzy)
```
GET /employees/search?search_type=empid&search_value=123&fuzzy=true
```

### Search by Department
```
GET /employees/search?search_type=department&search_value=DEPT001
```

### Search by Location
```
GET /employees/search?search_type=location&search_value=LOC001
```

### Filter by First Letter of Name
```
GET /employees/search?name_starts_with=A
```

### Combined: Name starting with letter + fuzzy search
```
GET /employees/search?name_starts_with=A&search_type=name&search_value=john&fuzzy=true
```

### Get All Employees (when no search criteria)
```
GET /employees/search
```

## Response Format

### Success Response (200 OK)
```json
{
  "employees": [
    {
      "empid": "196502",
      "employee_id": "196502",
      "employee_name": "Ravendra Singh",
      "name": "Ravendra Singh",
      "first_name": "Ravendra",
      "last_name": "Singh",
      "email": "ravendra@example.com",
      "department_id": "DEPT001",
      "department": "DEPT001",
      "location_id": "LOC001",
      "location": "LOC001",
      "is_active": "Y",
      "status": "active",
      // ... other employee fields
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 100
}
```

### Error Response (400/500)
```json
{
  "error": "Error message",
  "status": 400,
  "path": "/employees/search",
  "method": "GET"
}
```

## Implementation Notes

1. **Fuzzy Search**: When `fuzzy=true` and `search_type` is `name` or `empid`, the backend should perform fuzzy matching (e.g., Levenshtein distance, partial matching, etc.)

2. **Alphabet Filter**: When `name_starts_with` is provided, filter employees whose name (first name or full name) starts with that letter (case-insensitive)

3. **Combined Filters**: When both `name_starts_with` and `search_value` are provided:
   - First filter by `name_starts_with`
   - Then apply fuzzy search on the filtered results

4. **Department/Location Search**: When `search_type` is `department` or `location`, `search_value` should be the department/location ID

5. **No Search Criteria**: When no search parameters are provided, return all employees (or paginated results)

6. **Sorting**: Results should be sorted by:
   - Primary: Employee name (ascending)
   - Secondary: Employee ID (ascending)

## Frontend Integration

The frontend will:
- Call this API with appropriate query parameters based on user input
- Display results in list or grid view
- Handle loading states and errors
- Support real-time search as user types (with debouncing recommended)

