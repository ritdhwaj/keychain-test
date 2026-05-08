import { Page, Locator } from '@playwright/test';
import BasePage from '../base/BasePage';
import { logger } from '../utils/logger';

/**
 * ConduitProfilePage - Handles user profile page interactions
 *
 * @extends BasePage
 */
export class ConduitProfilePage extends BasePage {
    // LOCATORS
    private readonly myArticlesTab: Locator;
    private readonly favoritedArticlesTab: Locator;
    private readonly firstArticleFavoriteButton: Locator;
    private readonly firstArticleTitle: Locator;
    private readonly noArticlesText: Locator;

    constructor(page: Page) {
        super(page);
        this.myArticlesTab = page.getByRole('link', { name: 'My Articles' });
        this.favoritedArticlesTab = page.getByRole('link', { name: 'Favorited Articles' });
        this.firstArticleFavoriteButton = page.locator('.article-preview').first().getByRole('button');
        this.firstArticleTitle = page.locator('.article-preview h1').first();
        this.noArticlesText = page.locator('.article-preview').getByText('No articles are here... yet.');
        logger.info('ConduitProfilePage initialized');
    }

    get favButtonLocator() { return this.firstArticleFavoriteButton; }

    async navigateToProfile(baseURL: string, username: string): Promise<void> {
        await this.open(`${baseURL}/@${username}`);
    }

    async switchToFavoritedArticles(): Promise<void> {
        logger.info('Switching to Favorited Articles tab');
        await this.click(this.favoritedArticlesTab);
    }

    async switchToMyArticles(): Promise<void> {
        logger.info('Switching to My Articles tab');
        await this.click(this.myArticlesTab);
    }

    async favoriteFirstArticle(): Promise<void> {
        logger.info('Favoriting the first article');
        await this.click(this.firstArticleFavoriteButton);
    }

    async getFirstArticleTitle(): Promise<string> {
        return (await this.firstArticleTitle.textContent()) || '';
    }

    async isNoArticlesVisible(): Promise<boolean> {
        return await this.noArticlesText.isVisible();
    }
}
