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
        await expect(page.getByRole('link', { name: userData.username })).toBeVisible({ timeout: 15000 });

        // 2. LOG OUT AND SIGN IN
        await page.goto(`${baseURL}/settings`);
        await page.getByRole('button', { name: 'Or click here to logout.' }).click();
        await conduitSignInPage.navigateToSignIn(baseURL);
        await conduitSignInPage.signIn(userData.email, userData.password);
        await expect(page.getByRole('link', { name: userData.username })).toBeVisible({ timeout: 15000 });

        // 3. CREATE POST
        await page.getByRole('link', { name: ' New Post' }).click();
        await conduitPostPage.createPost(postData.title, postData.description, postData.body, postData.tags);
        await expect(page.locator('h1')).toHaveText(postData.title);

        // 4. ADD COMMENT
        await conduitPostPage.addComment(commentText);
        await expect(page.locator('.card-text')).toHaveText(commentText);

        // 5. DELETE COMMENT
        await conduitPostPage.deleteComment();
        await expect(page.locator('.card-text')).not.toBeVisible();

        // 6. UPDATE POST
        await conduitPostPage.updatePost(postData.updatedTitle, postData.updatedBody);
        await expect(page.locator('h1')).toHaveText(postData.updatedTitle);

        // 7. DELETE POST
        await conduitPostPage.deletePost();
        await expect(page).toHaveURL(baseURL + '/');
    });

    test('should update user profile in settings', async ({ page }) => {
        // Assuming user is already logged in from previous test or session
        // Actually, tests should be independent. I'll use the dummy user from .env
        await page.goto(`${baseURL}/login`);
        await page.getByPlaceholder('Email').fill(process.env.CONDUIT_TEST_EMAIL || 'conduituser@test.com');
        await page.getByPlaceholder('Password').fill(process.env.CONDUIT_TEST_PASSWORD || 'Conduit@123');
        await page.getByRole('button', { name: 'Sign in' }).click();

        await page.goto(`${baseURL}/settings`);
        const newBio = `Bio updated at ${new Date().toISOString()}`;
        await page.getByPlaceholder('Short bio about you').fill(newBio);
        await page.getByRole('button', { name: 'Update Settings' }).click();

        // Verify update
        await page.reload();
        await page.waitForTimeout(5000);
        await expect(page.getByPlaceholder('Short bio about you')).toHaveValue(newBio);
    });
    test('should mark an article as favorite and verify it on the profile page', async ({
        conduitSignUpPage,
        conduitPostPage,
        conduitProfilePage,
        page
    }) => {
        // 1. Create a user and a post
        await conduitSignUpPage.navigateToSignUp(baseURL);
        await conduitSignUpPage.signUp(`fav_user_${timestamp}`, `fav_${timestamp}@test.com`, 'Password123!');

        await page.getByRole('link', { name: ' New Post' }).click();
        await conduitPostPage.createPost(postData.title, postData.description, postData.body, postData.tags);

        // 2. Navigate to profile
        await conduitProfilePage.navigateToProfile(baseURL, `fav_user_${timestamp}`);

        // 3. Verify article in "My Articles"
        const title = await conduitProfilePage.getFirstArticleTitle();
        expect(title).toBe(postData.title);

        // 4. Favorite the article
        await conduitProfilePage.favoriteFirstArticle();

        // 5. Check in "Favorited Articles"
        await conduitProfilePage.switchToFavoritedArticles();
        const favTitle = await conduitProfilePage.getFirstArticleTitle();
        expect(favTitle).toBe(postData.title);

        // 6. Unfavorite and verify it's removed
        await conduitProfilePage.favoriteFirstArticle(); // Click again to unfavorite
        await page.reload(); // Reload to reflect changes in the favorites list
        await conduitProfilePage.switchToFavoritedArticles();

        // The article should no longer be present
        const isGone = await conduitProfilePage.isNoArticlesVisible();
        expect(isGone).toBeTruthy();
    });
});
