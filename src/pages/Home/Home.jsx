// Home.jsx
import React, { useState, useEffect } from "react";
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

const Home = () => {
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);

  const [seriesTitle, setSeriesTitle] = useState("");
  const [seriesDescription, setSeriesDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [category, setCategory] = useState("");

  const [episodeTitle, setEpisodeTitle] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [duration, setDuration] = useState("");
  const [seriesMode,setSeriesMode]=useState("");

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
    if (!selectedSeries || !episodeTitle || !mediaFile || !duration) {
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
      createdAt: Timestamp.now(),
    });

    alert("Episode added successfully!");
    setEpisodeTitle("");
    setMediaFile(null);
    setDuration("");
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

            {/* Category Dropdown for selecting type of series */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.select}
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}  </option>
              ))}
            </select>

            {/* Series Mode Dropdown: Audio or Video */}
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
                <button type="submit" className={styles.button}>
                  Add Episode
                </button>
              </form>

              {/* Display Total Episodes */}
              <p className={styles.episodeCount}>
                Total Episodes:{" "}
                {series.find((s) => s.id === selectedSeries)?.episodes
                  ?.length || 0}
              </p>
            </>
          )}
        </div>
      </div>
      {/* Display Episode List */}
      <div className={styles.episodeList}>
        <h2 style={{ textAlign: "center" }}>
          Episodes in{" "}
          {series.find((s) => s.id === selectedSeries)?.title ||
            "Select a series"}
        </h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          {series.find((s) => s.id === selectedSeries)?.episodes?.length > 0 ? (
            series
              .find((s) => s.id === selectedSeries)
              ?.episodes.map((episode, index) => (
                <div key={index} className={styles.episodeCard}>
                  <h3 className={styles.episodeTitle}>{episode.title}</h3>
                  <p className={styles.episodeDuration}>
                    Duration: {episode.duration}
                  </p>
                  <p>Created At : {formatDate(episode.createdAt)}</p>
                </div>
              ))
          ) : (
            <p>No episodes available for this series.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
