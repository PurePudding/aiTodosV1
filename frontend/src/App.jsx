import { useState, useEffect } from "react";
import { vapi, startAssistant, stopAssistant, getCallDetails } from "./ai";
import ActiveCallDetails from "./call/ActiveCallDetails";

function App() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callId, setCallId] = useState("");
  const [callResult, setCallResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  });

  useEffect(() => {
    const eventHandlers = {
      "call-start": () => {
        setLoading(false);
        setStarted(true);
      },
      "call-end": () => {
        setStarted(false);
        setLoading(false);
      },
      "speech-start": () => {
        setAssistantIsSpeaking(true);
      },
      "speech-end": () => {
        setAssistantIsSpeaking(false);
      },
      "volume-level": (level) => {
        setVolumeLevel(level);
      },
      error: (error) => {
        console.error("VAPI error:", error);
        setLoading(false);
        setStarted(false);
      },
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      vapi.on(event, handler);
    });

    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        vapi.off(event, handler);
      });
    };
  }, []);

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const data = await startAssistant(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.phoneNumber
      );
      setCallId(data.id);
    } catch (error) {
      console.error("Error starting assistant:", error);
      setLoading(false);
    }
  };

  const handleStop = async () => {
    stopAssistant();
    try {
      setLoadingResult(true);
      const result = await getCallDetails(callId);
      setCallResult(result);
    } catch (error) {
      console.error("Error getting call details:", error);
    } finally {
      setLoadingResult(false);
    }
  };

  const allFieldsFilled = Object.values(formData).every(
    (field) => field.trim() !== ""
  );

  return (
    <div className="app-container">
      {!started && !loading && !loadingResult && !callResult && (
        <>
          <h1>Contact Details (Required)</h1>
          {Object.keys(formData).map((field) => (
            <input
              key={field}
              type={
                field === "email"
                  ? "email"
                  : field === "phoneNumber"
                  ? "tel"
                  : "text"
              }
              placeholder={
                field === "firstName"
                  ? "First Name"
                  : field === "lastName"
                  ? "Last Name"
                  : field === "email"
                  ? "Email address"
                  : "Phone number"
              }
              value={formData[field]}
              className="input-field"
              onChange={handleInputChange(field)}
            />
          ))}
          <button
            onClick={handleStart}
            disabled={!allFieldsFilled}
            className={`button ${!allFieldsFilled ? "disabled" : ""}`}
          >
            Start Application Call
          </button>
        </>
      )}

      {loadingResult && <p>Loading call details... please wait</p>}

      {callResult && (
        <div className="call-result">
          <h2>Call Results</h2>
          <p>
            <strong>Qualified:</strong>{" "}
            {callResult.analysis?.structuredData?.is_qualified?.toString() ||
              "N/A"}
          </p>
          <p>
            <strong>Summary:</strong>{" "}
            {callResult.summary || "No summary available"}
          </p>
        </div>
      )}

      {(loading || loadingResult) && <div className="loading-spinner"></div>}

      {started && (
        <ActiveCallDetails
          assistantIsSpeaking={assistantIsSpeaking}
          volumeLevel={volumeLevel}
          endCallCallback={handleStop}
        />
      )}
    </div>
  );
}

export default App;
