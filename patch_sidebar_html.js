const fs = require('fs');

const content = fs.readFileSync('Components/Layout/MainLayout.razor', 'utf-8');

const startSidebar = content.indexOf('<aside class="app-sidebar">');
const endSidebar = content.indexOf('</aside>') + '</aside>'.length;

const newSidebar = `<aside class="app-sidebar">
            <div class="sidebar-profile">
                <i class="fa-regular fa-circle-user sidebar-avatar"></i>
                <div>
                    <strong>You</strong><br />
                    <span>@user</span>
                </div>
            </div>

            <nav class="sidebar-nav">
                <a href="/home" class="sidebar-link">
                    <i class="fa-solid fa-house"></i>
                    <span>Home</span>
                </a>

                <a href="/matches" class="sidebar-link">
                    <i class="fa-solid fa-heart"></i>
                    <span>Matches</span>
                </a>

                <a href="/messages" class="sidebar-link">
                    <i class="fa-solid fa-message"></i>
                    <span>Messages</span>
                </a>
            </nav>

            <div class="sidebar-search">
                <input type="text"
                        placeholder="Search..."
                        @bind="SearchTerm"
                        @bind:event="oninput" />

                <i class="fas fa-search search-icon"></i>

                <button type="button" class="filter-btn" @onclick="ToggleFilters">
                    <i class="fas fa-sliders-h"></i>
                </button>
            </div>

            <!-- OPTIONS MENU WRAPPER AT THE BOTTOM -->
            <div class="sidebar-options-wrapper" style="margin-top: auto; position: relative;">
                <button class="options-trigger-btn" @onclick="ToggleOptionsMenu" @onclick:preventDefault="true">
                    <i class="fa-solid fa-list"></i>
                    <span>Options</span>
                </button>

                <div class="sidebar-options-menu @(showOptionsMenu ? "show" : "")">
                    <a class="options-menu-item" href="/profile">
                        <i class="fa-solid fa-user"></i>
                        <span>Profile</span>
                    </a>
                    <a class="options-menu-item" href="/settings">
                        <i class="fa-solid fa-gear"></i>
                        <span>Settings</span>
                    </a>
                    <div class="invisible-bridge"></div>
                </div>
            </div>
        </aside>`;

const replacedContent = content.substring(0, startSidebar) + newSidebar + content.substring(endSidebar);

// Also we need to inject the showOptionsMenu property to the @code block
const codeIndex = replacedContent.indexOf('@code {');
const finalContent = replacedContent.substring(0, codeIndex + '@code {'.length) + `
    private bool showOptionsMenu = false;

    private void ToggleOptionsMenu()
    {
        showOptionsMenu = !showOptionsMenu;
        StateHasChanged();
    }
` + replacedContent.substring(codeIndex + '@code {'.length);


fs.writeFileSync('Components/Layout/MainLayout.razor', finalContent, 'utf-8');
