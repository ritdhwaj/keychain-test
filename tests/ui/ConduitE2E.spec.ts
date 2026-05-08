import { test, expect } from '../../src/fixtures/TestFixtures';

/**
 * Conduit E2E Flow (Extended):
 * 1. Sign Up with random data
 * 2. Log Out and Sign In
 * 3. Create, Update, and Delete Post
 * 4. Add and Delete Comment
 */

test.describe('Conduit E2E Flow (Extended)', () => {
    const baseURL = process.env.BASE_URL || 'http://localhost:4101';
    const timestamp = Date.now();
    const userData = {
        username: `user_${timestamp}`,
        email: `user_${timestamp}@test.com`,
        password: 'Password123!'
    };
    const postData = {
        title: `E2E Post ${timestamp}`,
        description: 'E2E Description',
        body: 'E2E Body content',
        tags: 'e2e, test',
        updatedTitle: `Updated E2E Post ${timestamp}`,
        updatedBody: 'Updated E2E Body content'
    };
    const commentText = 'This is an E2E comment';

    test('should complete the full E2E flow including comments', async ({
        conduitSignUpPage,
        conduitSignInPage,
        conduitPostPage,
        page
    }) => {

        // 1. SIGN UP
        await conduitSignUpPage.navigateToSignUp(baseURL);
        await conduitSignUpPage.signUp(userData.username, userData.email, userData.password);
        await expect(conduitSignUpPage.userLink(userData.username)).toBeVisible({ timeout: 15000 });

        // 2. LOG OUT AND SIGN IN
        await page.goto(`${baseURL}/settings`);
        await conduitSignUpPage.logoutButton.click();
        await conduitSignInPage.navigateToSignIn(baseURL);
        await conduitSignInPage.signIn(userData.email, userData.password);
        await expect(conduitSignUpPage.userLink(userData.username)).toBeVisible({ timeout: 15000 });

        // 3. CREATE POST
        await conduitSignUpPage.newPostLink.click();
        await conduitPostPage.createPost(postData.title, postData.description, postData.body, postData.tags);
        await expect(conduitPostPage.titleLocator).toHaveText(postData.title);

        // 4. ADD COMMENT
        await conduitPostPage.addComment(commentText);
        await expect(conduitPostPage.commentLocator).toHaveText(commentText);

        // 5. DELETE COMMENT
        await conduitPostPage.deleteComment();
        await expect(conduitPostPage.commentLocator).not.toBeVisible();

        // 6. UPDATE POST
        await conduitPostPage.updatePost(postData.updatedTitle, postData.updatedBody);
        await expect(conduitPostPage.titleLocator).toHaveText(postData.updatedTitle);

        // 7. DELETE POST
        await conduitPostPage.deletePost();
        await expect(page).toHaveURL(baseURL + '/');
    });

    test('should update user profile in settings', async ({ conduitSettingsPage, cfg, page }) => {
        // Reuse global auth state - navigate directly to settings
        await page.goto(`${cfg.baseURL}/settings`);
        
        const newBio = `Bio updated at ${new Date().toISOString()}`;
        await conduitSettingsPage.updateBio(newBio);

        // The app redirects to the home page after update
        // We'll wait for the home page and then navigate back to settings to verify persistence
        await expect(page).toHaveURL(`${cfg.baseURL}/`);
        await page.goto(`${cfg.baseURL}/settings`);
        await expect(conduitSettingsPage.bioLocator).toHaveValue(newBio);
    });
    test('should mark an article as favorite and verify it on the profile page', async ({
        conduitSignUpPage,
        conduitPostPage,
        conduitProfilePage,
        cfg,
        page
    }) => {
        const favUser = `fav_user_${timestamp}`;
        await conduitSignUpPage.navigateToSignUp(baseURL);
        await conduitSignUpPage.signUp(favUser, `fav_${timestamp}@test.com`, 'Password123!');
        
        // Wait for login to complete
        await expect(conduitSignUpPage.userLink(favUser)).toBeVisible({ timeout: 15000 });
        
        await conduitSignUpPage.newPostLink.click();
        await conduitPostPage.createPost(postData.title, postData.description, postData.body, postData.tags);

        // 2. Navigate to profile
        await conduitProfilePage.navigateToProfile(cfg.baseURL, `fav_user_${timestamp}`);

        // 3. Verify article in "My Articles" - Use a retry-friendly expectation
        await expect(page.locator('.article-preview h1').first()).toBeVisible({ timeout: 10000 });
        const title = await conduitProfilePage.getFirstArticleTitle();
        expect(title.trim()).toBe(postData.title);

        // 4. Favorite the article
        await conduitProfilePage.favoriteFirstArticle();
        // Verify it becomes primary (favorited state in Conduit)
        await expect(conduitProfilePage.favButtonLocator).toHaveClass(/btn-primary/);

        // 5. Check in "Favorited Articles"
        await conduitProfilePage.switchToFavoritedArticles();
        await expect(page.locator('.article-preview h1').first()).toBeVisible({ timeout: 10000 });
        const favTitle = await conduitProfilePage.getFirstArticleTitle();
        expect(favTitle.trim()).toBe(postData.title);

        // 6. Unfavorite and verify it's removed
        await conduitProfilePage.favoriteFirstArticle(); 
        // Wait for it to lose the primary class
        await expect(conduitProfilePage.favButtonLocator).not.toHaveClass(/btn-primary/);
        
        await page.reload(); 
        await conduitProfilePage.switchToFavoritedArticles();

        // The article should no longer be present
        await expect(page.locator('.article-preview').getByText('No articles are here... yet.')).toBeVisible();
    });
});
