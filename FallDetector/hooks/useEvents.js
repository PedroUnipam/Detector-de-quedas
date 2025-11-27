import { useApi } from "./useApi";
import { useState, useEffect, useCallback } from "react";

/**
 * @typedef {Object} PatientInfo
 * @property {string} street - Patient street address
 * @property {string} city - Patient city
 * @property {string} state - Patient state
 * @property {string} zipCode - Patient zip code
 */

/**
 * @typedef {Object} Patient
 * @property {string} name - Patient name
 * @property {string} cellphone - Patient cellphone number
 * @property {PatientInfo} patientInfo - Patient address information
 */

/**
 * @typedef {Object} Event
 * @property {string} id - Event ID
 * @property {string} date - Event date
 * @property {string} type - Event type
 * @property {string} patientUserId - Patient user ID
 * @property {Patient} patient - Patient information
 */

/**
 * Hook to fetch events data
 * @typedef {Object} useEventReturn
 * @property {Event[]} events - Array of events
 * @property {boolean} loading - Loading state
 * @property {Error} error - Error object if any
 * @property {() => Promise<void>} refetchEvents - Function to refetch events
 * @returns {useEventReturn}
 */
export function useEvents() {
  const api = useApi();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const refetchEvents = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("events");
      setEvents(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    refetchEvents();
  }, []);

  return { events, loading, error, refetchEvents };
}
