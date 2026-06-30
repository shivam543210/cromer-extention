export async function extractFromCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ig;
            const phoneRegex = /(\+?\d[\d\s()-]{8,}\d)/g;
            const urlRegex = /https?:\/\/[^\s]+/ig;
            const payoutRegex = /(?:₹|\$|USD|INR|€|£)\s*\d+(?:[.,]\d+)*(?:\s*(?:k|K|m|M|LPA|lpa|Lakhs?|lakhs?|Cr|cr|Crores?|crores?))?(?:\s*-\s*(?:₹|\$|USD|INR|€|£)?\s*\d+(?:[.,]\d+)*(?:\s*(?:k|K|m|M|LPA|lpa|Lakhs?|lakhs?|Cr|cr|Crores?|crores?))?)?(?:\s*\/?\s*(?:yr|month|hr|annum|pa|p\.a\.|LPA|lpa))?/g;
            const locationRegex = /(?:location|loc|office|city|place|based|work from|remote in)\s*:?\s*([^\n,.]+)/gi;
            const experienceRegex = /(?:experience|exp|years?|yr)\s*:?\s*([^\n,.]+(?:years?|yrs?|yr)?)/gi;

            const selectors = [
                'article[data-view-name="feed-v2-feed-list-item"]',
                '.feed-shared-update-v2',
                '.occludable-update',
                '[data-testid="expandable-text-box"]',
                '.update-components-text-view',
                '.update-components-article',
                'article',
                '.jobs-home__detail-card',
                '[data-view-name="feed-v2-feed-list-item"]',
                '.feed-shared-update__description',
                '.break-words',
                '.jobs-details__main-content'
            ];
            const container = selectors.reduce((found, sel) => found || document.querySelector(sel), null);
            const posts = container ? [...document.querySelectorAll(selectors.join(','))] : [...document.querySelectorAll('[class*="feed"], article, [class*="update"], [class*="post"]')].filter(el => el.innerText.trim().length > 50 && !el.closest('header, nav, footer'));

            return [...posts].map(post => {
                const text = post.innerText.trim();
                const parent = post.closest('[role="listitem"]') || post.closest('.feed-shared-update-v2') || post.closest('.occludable-update') || post.closest('article');
                const companyEl = parent ? parent.querySelector('.update-components-actor__name, .feed-shared-actor__name, .profile-card-one-to-one__name-link, h3, [data-anonymize="company-name"], p span') : null;
                const companyNodeText = companyEl?.innerText?.trim() || "";

                let postingTime = "";
                if (parent) {
                    const timeEl = parent.querySelector('time');
                    if (timeEl) {
                        postingTime = timeEl.getAttribute('datetime') || timeEl.innerText || '';
                    }
                    if (!postingTime) {
                        const actorInfo = parent.querySelector('.update-components-actor__meta, .feed-shared-actor__meta');
                        if (actorInfo) {
                            const timeMatch = actorInfo.innerText.match(/(\d+\s*(?:s|m|h|d|w|mo|yr|second|minute|hour|day|week|month|year)s?\s*(?:ago)?)/i);
                            if (timeMatch) postingTime = timeMatch[1].trim();
                        }
                    }
                    if (!postingTime) {
                        const timeText = parent.querySelector('[class*="time"], [class*="date"], [class*="timestamp"]');
                        if (timeText) postingTime = timeText.innerText.trim();
                    }
                }

                let postUrl = '';
                if (parent) {
                    const linkEl = parent.querySelector('a[href*="/posts/"], a[href*="/feed/update/"], a[href*="/feed/"]');
                    if (linkEl) postUrl = linkEl.href;
                }

                const payouts = text.match(payoutRegex) || [];
                let payout = payouts.length > 0 ? payouts[0] : "";
                if (!payout) {
                    const ctcMatch = text.match(/(?:CTC|Salary|Payout)\s*[:-]?\s*([0-9.,]+\s*(?:LPA|lpa|Lakhs?|k|K|m|M))/i);
                    if (ctcMatch) payout = ctcMatch[1].trim();
                }

                let location = '';
                const locMatch = locationRegex.exec(text);
                if (locMatch) location = locMatch[1].trim();

                let experience = '';
                const expMatch = experienceRegex.exec(text);
                if (expMatch) experience = expMatch[1].trim();

                const allLinks = [...new Set(text.match(urlRegex) || [])];
                const applyLink = allLinks.find(l => !l.includes('linkedin.com')) || allLinks[0] || '';

                return {
                    text,
                    companyNodeText,
                    payout,
                    postingTime,
                    postUrl,
                    location,
                    experience,
                    applyLink,
                    emails: [...new Set(text.match(emailRegex) || [])],
                    phones: [...new Set(text.match(phoneRegex) || [])],
                    links: allLinks
                };
            });
        }
    });

    return result || [];
}
