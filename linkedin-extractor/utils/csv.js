export function generateCSV(jobs) {
    if (jobs.length === 0) return "";
    const headers = ["Company", "Role", "Payout", "Location", "Experience", "Emails", "Phones", "Links", "Apply Link", "Tags", "Post", "Posted At", "ExtractedAt"];
    
    const rows = jobs.map(job => {
        return [
            job.company || "",
            job.role || "",
            job.payout || "",
            job.location || "",
            job.experience || "",
            job.emails.join('; ') || "",
            job.phones.join('; ') || "",
            job.links.join('; ') || "",
            job.applyLink || "",
            job.tags.join('; ') || "",
            (job.post || "").replace(/"/g, '""'), // escape quotes
            job.postingTime || job.postedAt || "",
            job.createdAt || ""
        ].map(field => `"${field}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}
