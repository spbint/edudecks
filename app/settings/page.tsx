async function handleSave() {
  setSaving(true);
  setSaveError("");

  try {
    persistSettingsToLocalStorage(settings);

    if (!userId) {
      setStorageMode("local");
      setInitialSettings(settings);
      setSavedAt(new Date().toLocaleString());
      return;
    }

    let data: any = null;

    try {
      data = await upsertFamilyProfile(settings);
    } catch {
      setStorageMode("local");
      setSaveError(
        "Settings were saved locally, but the family profile could not be updated in the database."
      );
      setInitialSettings(settings);
      setSavedAt(new Date().toLocaleString());
      return;
    }

    const merged: FamilySettings = {
      ...DEFAULT_FAMILY_SETTINGS,
      ...rowToSettings(data),
      default_child_id: data?.default_child_id || settings.default_child_id || "",
    };

    setStorageMode("database");
    setSettings(merged);
    setInitialSettings(merged);
    persistSettingsToLocalStorage(merged);
    setSavedAt(new Date().toLocaleString());
  } finally {
    setSaving(false);
  }
}