export function normalize(posts) {
    return posts.map(post => {
        return {
            ...post,
            post: post.text ? post.text.trim() : "",
            text: post.text ? post.text.trim() : "",
            emails: [...new Set(post.emails)].map(e => e.toLowerCase()),
            phones: [...new Set(post.phones)],
            links: [...new Set(post.links)],
            payout: post.payout || "",
            location: post.location || "",
            experience: post.experience || "",
            postingTime: post.postingTime || "",
            postUrl: post.postUrl || "",
            applyLink: post.applyLink || ""
        };
    });
}
