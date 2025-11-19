import React from "react";
import EmployeeCard from "./EmployeeCard";

const EmployeeList = ({ employees, departments, locations, managers, onUpdate }) => {

  return (
    <div className="space-y-3">
      {employees && Array.isArray(employees) && employees.length > 0 ? (
        employees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            departments={departments}
            locations={locations}
            managers={managers}
            onUpdate={onUpdate}
          />
        ))
      ) : (
        <p className="text-center text-gray-500 py-8">No employees found</p>
      )}
    </div>
  );
};

export default EmployeeList;
