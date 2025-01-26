import { useState, useEffect } from "react";
import { db, storage } from "../../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import styles from "./style.module.css";
import { formatDate } from "../../functions/formatDate";

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
  const [episodesBySeriesAndLanguage, setEpisodesBySeriesAndLanguage] = useState({});

  const [seriesTitle, setSeriesTitle] = useState("");
  const [seriesDescription, setSeriesDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [category, setCategory] = useState("");

  const [episodeTitle, setEpisodeTitle] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [duration, setDuration] = useState("");
  const [seriesMode, setSeriesMode] = useState("");
  const [language, setLanguage] = useState(""); // Language for episodes

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
    if (!selectedSeries || !episodeTitle || !mediaFile || !duration || !language) {
      alert("All episode fields are required!");
      return;
    }
    const mediaRef = ref(storage, `media/${mediaFile.name}`);
    await uploadBytes(mediaRef, mediaFile);
    const mediaUrl = await getDownloadURL(mediaRef);

    const episodesRef = collection(db, "series", selectedSeries, "episodes");
    await addDoc(episodesRef, {
      title: episodeTitle,
      duration,
      mediaUrl,
      language,
      createdAt: Timestamp.now(),
    });

    alert("Episode added successfully!");
    setEpisodeTitle("");
    setMediaFile(null);
    setDuration("");
    setLanguage("");
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
          <select
            onChange={(e) => setSelectedSeries(e.target.value)}
            className={styles.select}
          >
            <option value="">Select a Series</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
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
            {Object.keys(episodesBySeriesAndLanguage[selectedSeries] || {}).map((lang) => (
              <li
                key={lang}
                className={selectedLanguage === lang ? styles.activeLanguage : ""}
                onClick={() => setSelectedLanguage(lang)}
              >
                {lang}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.episodeDisplay}>
          <h2>Episodes in {selectedLanguage || "Select a language"}</h2>
          <div className={styles.episodeContainer}>
            {episodesBySeriesAndLanguage[selectedSeries]?.[selectedLanguage]?.length > 0 ? (
              episodesBySeriesAndLanguage[selectedSeries][selectedLanguage].map((episode, index) => (
                <div key={index}  className={styles.epCard}>
                  <h3>{episode.title}</h3>
                  <p>Duration: {episode.duration}</p>
                  <p>Language: {episode.language}</p>
                  <p>CreatedAt: {formatDate(episode.createdAt)}</p>
                </div>
              ))
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
