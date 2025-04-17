import { useState, useEffect } from "react";
import { db, storage } from "../../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import styles from "./style.module.css";
import { formatDate } from "../../functions/formatDate";
import { deleteObject } from "firebase/storage"; // Import deleteObject

const categories = [
  "Love",
  "Thriller",
  "Fantasy",
  "Entertainment",
  "Crime",
  "Horror",
  "Personal Finance",
  "Historical",
  "Business",
  "Information",
  "Career",
  "Motivation",
  "Mythology",
  "Lifestyle",
  "Health",
  "Production",
  "Spirituality",
  "Bytes",
];

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Hindi",
  "Mandarin",
  "Portuguese",
  "Arabic",
  "Russian",
  "Japanese",
  // Add more languages here as needed
];

const Home = () => {
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(""); // Language state
  const [episodesBySeriesAndLanguage, setEpisodesBySeriesAndLanguage] =
    useState({});
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // State to control overlay visibility

  const [seriesTitle, setSeriesTitle] = useState("");
  const [seriesDescription, setSeriesDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [category, setCategory] = useState("");

  const [episodeTitle, setEpisodeTitle] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [duration, setDuration] = useState("");
  const [seriesMode, setSeriesMode] = useState("");
  const [language, setLanguage] = useState(""); // Language for episodes
  const [editEpisode, setEditEpisode] = useState(null);

  const fetchSeries = async () => {
    const q = query(collection(db, "series"));
    const snapshot = await getDocs(q);
    const seriesData = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const series = doc.data();
        const episodesSnapshot = await getDocs(
          collection(db, "series", doc.id, "episodes")
        );
        const episodes = episodesSnapshot.docs.map((doc) => doc.data());
        return { id: doc.id, ...series, episodes };
      })
    );
    setSeries(seriesData);
    categorizeEpisodesBySeriesAndLanguage(seriesData);
  };

  const categorizeEpisodesBySeriesAndLanguage = (seriesData) => {
    const categorized = {};
    seriesData.forEach((seriesItem) => {
      seriesItem.episodes.forEach((episode) => {
        if (!categorized[seriesItem.id]) {
          categorized[seriesItem.id] = {};
        }
        if (!categorized[seriesItem.id][episode.language]) {
          categorized[seriesItem.id][episode.language] = [];
        }
        categorized[seriesItem.id][episode.language].push(episode);
      });
    });
    setEpisodesBySeriesAndLanguage(categorized);
  };

  const handleCreateSeries = async (e) => {
    e.preventDefault();
    if (!seriesTitle || !thumbnail || !category) {
      alert("Title, thumbnail, and category are required!");
      return;
    }
    const thumbnailRef = ref(storage, `thumbnails/${thumbnail.name}`);
    await uploadBytes(thumbnailRef, thumbnail);
    const thumbnailUrl = await getDownloadURL(thumbnailRef);

    await addDoc(collection(db, "series"), {
      title: seriesTitle,
      description: seriesDescription,
      thumbnailUrl,
      category,
      seriesMode,
      status: "ongoing",
      numPlays: 0,
      ratings: 0,
      numRatings: 0,
      contentRating: "PG",
      createdAt: Timestamp.now(),
    });

    alert("Series created successfully!");
    setSeriesTitle("");
    setSeriesDescription("");
    setThumbnail(null);
    setCategory("");
    setSeriesMode("");
    fetchSeries();
  };

  const handleCreateEpisode = async (e) => {
    e.preventDefault();
    if (
      !selectedSeries ||
      !episodeTitle ||
      !mediaFile ||
      !duration ||
      !language
    ) {
      alert("All episode fields are required!");
      return;
    }

    const episodesRef = collection(db, "series", selectedSeries, "episodes");

    // Fetch existing episodes to determine the next episode number
    const episodesSnapshot = await getDocs(episodesRef);
    const nextEpisodeNumber = episodesSnapshot.size + 1;

    const mediaRef = ref(storage, `media/${mediaFile.name}`);
    await uploadBytes(mediaRef, mediaFile);
    const mediaUrl = await getDownloadURL(mediaRef);

    // Add the episode and retrieve the document reference
    const docRef = await addDoc(episodesRef, {
      title: episodeTitle,
      duration,
      mediaUrl,
      language,
      episodeNumber: nextEpisodeNumber, // Automatically assign episode number
      createdAt: Timestamp.now(),
    });

    // Update the newly created document to include the ID
    await updateDoc(docRef, { id: docRef.id });

    alert("Episode added successfully!");
    setEpisodeTitle("");
    setMediaFile(null);
    setDuration("");
    setLanguage("");
    fetchSeries(); // Refresh the series list
  };

  const handleDeleteEpisode = async (seriesId, episodeId) => {
    if (window.confirm("Are you sure you want to delete this episode?")) {
      try {
        // Get the episode document
        const episodeRef = doc(db, "series", seriesId, "episodes", episodeId);
        const episodeDoc = await getDoc(episodeRef);

        if (episodeDoc.exists()) {
          const episodeData = episodeDoc.data();

          // Delete the media file from storage
          if (episodeData.mediaUrl) {
            const mediaRef = ref(storage, episodeData.mediaUrl);
            await deleteObject(mediaRef);
          }

          // Delete the episode document
          await deleteDoc(episodeRef);

          alert("Episode deleted successfully!");
          fetchSeries(); // Refresh the series list
        } else {
          alert("Episode does not exist.");
        }
      } catch (error) {
        console.error("Error deleting episode:", error);
        alert("Failed to delete episode.");
      }
    }
  };

  const handleUpdateEpisode = async (e) => {
    e.preventDefault();
    if (!editEpisode.title || !editEpisode.duration || !editEpisode.language) {
      alert("All fields are required!");
      console.error("Missing required fields:", {
        title: editEpisode.title,
        duration: editEpisode.duration,
        language: editEpisode.language,
      });
      return;
    }

    try {
      const episodeRef = doc(
        db,
        "series",
        selectedSeries,
        "episodes",
        editEpisode.id
      );
      const updatedData = {
        title: editEpisode.title,
        duration: editEpisode.duration,
        language: editEpisode.language,
      };

      // Check if a new media file is uploaded
      if (editEpisode.mediaFile && editEpisode.mediaFile.name) {
        const oldMediaUrl = editEpisode.mediaUrl;

        // Upload the new file
        const mediaRef = ref(storage, `media/${editEpisode.mediaFile.name}`);
        await uploadBytes(mediaRef, editEpisode.mediaFile);
        const mediaUrl = await getDownloadURL(mediaRef);
        updatedData.mediaUrl = mediaUrl;

        // Delete the old media file
        if (oldMediaUrl) {
          const oldMediaRef = ref(storage, oldMediaUrl);
          await deleteObject(oldMediaRef);
        }
      }

      await updateDoc(episodeRef, updatedData);
      alert("Episode updated successfully!");
      setEditEpisode(null); // Clear edit mode
      fetchSeries(); // Refresh data
    } catch (error) {
      console.error("Error updating episode:", error);
      alert("Failed to update episode.");
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Manage Your Series</h1>
      <div className={styles.horizontalLayout}>
        {/* Create Series Section */}
        <div className={styles.section}>
          <h2 className={styles.title}>Create Series</h2>
          <form onSubmit={handleCreateSeries} className={styles.form}>
            <input
              type="text"
              placeholder="Series Title"
              value={seriesTitle}
              onChange={(e) => setSeriesTitle(e.target.value)}
              required
              className={styles.input}
            />
            <textarea
              placeholder="Series Description"
              value={seriesDescription}
              onChange={(e) => setSeriesDescription(e.target.value)}
              className={styles.textarea}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0])}
              required
              className={styles.fileInput}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.select}
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={seriesMode}
              onChange={(e) => setSeriesMode(e.target.value)}
              className={styles.select}
              required
            >
              <option value="">Select Series Mode</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>
            <button type="submit" className={styles.button}>
              Create Series
            </button>
          </form>
        </div>

        {/* Add Episodes Section */}
        <div className={styles.section}>
          <h2 className={styles.title}>Add Episodes</h2>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Search Series"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownVisible(true); // Show overlay when typing
              }}
              className={styles.episodeSearchInput}
            />
            {isDropdownVisible && (
              <>
                <div
                  className={styles.overlay}
                  onClick={() => {
                    setIsDropdownVisible(false); // Hide overlay and dropdown on click
                    setSearchQuery(""); // Optionally clear the search query
                  }}
                ></div>
                <div className={styles.dropdown}>
                  {series
                    .filter((s) =>
                      s.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((s) => (
                      <div
                        key={s.id}
                        className={`${styles.dropdownItem} ${
                          selectedSeries === s.id
                            ? styles.activeDropdownItem
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedSeries(s.id);
                          setSearchQuery(""); // Clear search query after selection
                          setIsDropdownVisible(false); // Hide overlay
                        }}
                      >
                        {s.title}
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
          {selectedSeries && (
            <>
              <form onSubmit={handleCreateEpisode} className={styles.form}>
                <input
                  type="text"
                  placeholder="Episode Title"
                  value={episodeTitle}
                  onChange={(e) => setEpisodeTitle(e.target.value)}
                  required
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Duration (HH:MM:SS)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  className={styles.input}
                />
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => setMediaFile(e.target.files[0])}
                  required
                  className={styles.fileInput}
                />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="">Select Language</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                <button type="submit" className={styles.button}>
                  Add Episode
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Episode List Section */}
      <div className={styles.episodeList}>
        <div className={styles.languageSidebar}>
          <h3>Select Language</h3>
          <ul>
            {Object.keys(episodesBySeriesAndLanguage[selectedSeries] || {}).map(
              (lang) => (
                <li
                  key={lang}
                  className={
                    selectedLanguage === lang ? styles.activeLanguage : ""
                  }
                  onClick={() => setSelectedLanguage(lang)}
                >
                  {lang}
                </li>
              )
            )}
          </ul>
        </div>

        <div className={styles.episodeDisplay}>
          <h2>Episodes in {selectedLanguage || "Select a language"}</h2>
          <div className={styles.episodeContainer}>
            {episodesBySeriesAndLanguage[selectedSeries]?.[selectedLanguage]
              ?.length > 0 ? (
              episodesBySeriesAndLanguage[selectedSeries][selectedLanguage].map(
                (episode, index) => (
                  <div key={index} className={styles.epCard}>
                    <h3>{episode.title}</h3>
                    <p>Duration: {episode.duration}</p>
                    <p>Language: {episode.language}</p>
                    <p>CreatedAt: {formatDate(episode.createdAt)}</p>
                    <button
                      onClick={() =>
                        handleDeleteEpisode(selectedSeries, episode.id)
                      }
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() =>
                        setEditEpisode({ ...episode, id: episode.id })
                      }
                      className={styles.editButton}
                    >
                      Edit
                    </button>

                    {editEpisode && editEpisode.id === episode.id && (
                      <div className={styles.editFormWrapper}>
                        <form
                          onSubmit={handleUpdateEpisode}
                          className={styles.form}
                        >
                          <input
                            type="text"
                            placeholder="Episode Title"
                            value={editEpisode.title}
                            onChange={(e) =>
                              setEditEpisode({
                                ...editEpisode,
                                title: e.target.value,
                              })
                            }
                            required
                            className={styles.input}
                          />
                          <input
                            type="text"
                            placeholder="Duration (HH:MM:SS)"
                            value={editEpisode.duration}
                            onChange={(e) =>
                              setEditEpisode({
                                ...editEpisode,
                                duration: e.target.value,
                              })
                            }
                            required
                            className={styles.input}
                          />
                          <input
                            type="file"
                            accept="audio/*,video/*"
                            onChange={(e) => {
                              if (e.target.files.length > 0) {
                                setEditEpisode({
                                  ...editEpisode,
                                  mediaFile: e.target.files[0],
                                });
                              }
                            }}
                            className={styles.fileInput}
                          />
                          <select
                            value={editEpisode.language}
                            onChange={(e) =>
                              setEditEpisode({
                                ...editEpisode,
                                language: e.target.value,
                              })
                            }
                            className={styles.select}
                            required
                          >
                            <option value="">Select Language</option>
                            {languages.map((lang) => (
                              <option key={lang} value={lang}>
                                {lang}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className={styles.button}>
                            Update Episode
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditEpisode(null)}
                            className={styles.cancelButton}
                          >
                            Cancel
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )
              )
            ) : (
              <p>No episodes available for this language and series.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
