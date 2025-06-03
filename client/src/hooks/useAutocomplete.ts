import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AutocompleteOption } from "@/components/ui/autocomplete";

interface UseAutocompleteOptions {
  endpoint: string;
  searchKey?: string;
  queryKey: string[];
  enabled?: boolean;
  debounceMs?: number;
  minSearchLength?: number;
  transform?: (data: any[]) => AutocompleteOption[];
}

export function useAutocomplete({
  endpoint,
  searchKey = "search",
  queryKey,
  enabled = true,
  debounceMs = 300,
  minSearchLength = 0,
  transform
}: UseAutocompleteOptions) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  const shouldFetch = enabled && (debouncedSearch.length >= minSearchLength || debouncedSearch === "");

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKey, debouncedSearch],
    queryFn: async () => {
      const url = new URL(endpoint, window.location.origin);
      if (debouncedSearch) {
        url.searchParams.set(searchKey, debouncedSearch);
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: shouldFetch,
  });

  const options: AutocompleteOption[] = transform && data ? transform(data) : data || [];

  return {
    options,
    isLoading,
    error,
    searchTerm,
    setSearchTerm
  };
}

// Specific autocomplete hooks for different entities
export function usePatientAutocomplete(searchTerm?: string) {
  return useAutocomplete({
    endpoint: "/api/patients/search",
    queryKey: ["patients", "autocomplete"],
    transform: (patients) => patients.map((patient: any) => ({
      value: patient.id.toString(),
      label: `${patient.firstName} ${patient.lastName}`,
      description: `${patient.title || ''} • ${patient.phone || 'No phone'} • ID: ${patient.id}`,
      category: "Patients",
      metadata: patient
    }))
  });
}

export function useMedicineAutocomplete() {
  return useAutocomplete({
    endpoint: "/api/medicines/search",
    queryKey: ["medicines", "autocomplete"],
    transform: (medicines) => medicines.map((medicine: any) => ({
      value: medicine.id.toString(),
      label: medicine.name,
      description: `${medicine.strength} • ${medicine.form} • ${medicine.category}`,
      category: medicine.category,
      metadata: medicine
    }))
  });
}

export function useLabTestAutocomplete() {
  return useAutocomplete({
    endpoint: "/api/lab-tests/search",
    queryKey: ["lab-tests", "autocomplete"],
    transform: (tests) => tests.map((test: any) => ({
      value: test.id.toString(),
      label: test.name,
      description: `${test.category} • ${test.description || 'No description'}`,
      category: test.category,
      metadata: test
    }))
  });
}

export function useDoctorAutocomplete() {
  return useAutocomplete({
    endpoint: "/api/users/doctors/search",
    queryKey: ["doctors", "autocomplete"],
    transform: (doctors) => doctors.map((doctor: any) => ({
      value: doctor.id.toString(),
      label: doctor.username,
      description: `${doctor.role} • ${doctor.organization?.name || 'No organization'}`,
      category: "Medical Staff",
      metadata: doctor
    }))
  });
}

export function useSpecialtyAutocomplete() {
  const specialties = [
    "General Medicine", "Cardiology", "Dermatology", "Endocrinology",
    "Gastroenterology", "Hematology", "Neurology", "Oncology",
    "Orthopedics", "Pediatrics", "Psychiatry", "Radiology",
    "Surgery", "Urology", "Gynecology", "Ophthalmology",
    "ENT", "Anesthesiology", "Emergency Medicine", "Family Medicine"
  ];

  return {
    options: specialties.map(specialty => ({
      value: specialty.toLowerCase().replace(/\s+/g, '-'),
      label: specialty,
      description: `Medical specialty`,
      category: "Specialties"
    })),
    isLoading: false,
    error: null,
    searchTerm: "",
    setSearchTerm: () => {}
  };
}

export function useDiagnosisAutocomplete() {
  return useAutocomplete({
    endpoint: "/api/diagnoses/search",
    queryKey: ["diagnoses", "autocomplete"],
    minSearchLength: 2,
    transform: (diagnoses) => diagnoses.map((diagnosis: any) => ({
      value: diagnosis.code || diagnosis.id?.toString(),
      label: diagnosis.name,
      description: `${diagnosis.code ? `Code: ${diagnosis.code}` : ''} • ${diagnosis.category || 'General'}`,
      category: diagnosis.category || "Diagnoses",
      metadata: diagnosis
    }))
  });
}

export function useSymptomAutocomplete() {
  const commonSymptoms = [
    "Fever", "Headache", "Cough", "Sore throat", "Runny nose",
    "Fatigue", "Muscle aches", "Nausea", "Vomiting", "Diarrhea",
    "Abdominal pain", "Chest pain", "Shortness of breath", "Dizziness",
    "Joint pain", "Back pain", "Skin rash", "Weight loss", "Weight gain",
    "Loss of appetite", "Difficulty sleeping", "Anxiety", "Depression"
  ];

  return {
    options: commonSymptoms.map(symptom => ({
      value: symptom.toLowerCase().replace(/\s+/g, '-'),
      label: symptom,
      description: "Common symptom",
      category: "Symptoms"
    })),
    isLoading: false,
    error: null,
    searchTerm: "",
    setSearchTerm: () => {}
  };
}

export function usePharmacyAutocomplete() {
  return useAutocomplete({
    endpoint: "/api/pharmacies/search",
    queryKey: ["pharmacies", "autocomplete"],
    transform: (pharmacies) => pharmacies.map((pharmacy: any) => ({
      value: pharmacy.id.toString(),
      label: pharmacy.name,
      description: `${pharmacy.address} • ${pharmacy.phone || 'No phone'}`,
      category: "Pharmacies",
      metadata: pharmacy
    }))
  });
}